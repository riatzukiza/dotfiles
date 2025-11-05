import type { Plugin } from '@opencode-ai/plugin';
import { createHash } from 'node:crypto';
import { promises as fsp } from 'node:fs';
import { tmpdir } from 'node:os';
import * as path from 'node:path';

type DiskLock = Readonly<{
  sessionId: string;
  timestamp: number;
  agentId?: string;
  normalizedPath: string;
}>;

type ActiveCallLock = Readonly<{
  normalizedPath: string;
}>;

const LOCK_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
const LOCK_ROOT_DIR = path.join(tmpdir(), 'opencode', 'locks');

const WRITE_TOOLS = new Set([
  'write',
  'edit',
  'serena_create_text_file',
  'serena_replace_regex',
  'serena_replace_symbol_body',
  'serena_insert_before_symbol',
  'serena_insert_after_symbol',
]);

const sessionHoldCounts = new Map<string, Map<string, number>>();
const callLocks = new Map<string, ActiveCallLock>();

function normalizePath(filePath: string): string {
  return filePath.replace(/\\/g, '/').normalize();
}

function makeLockFilePath(normalizedPath: string): string {
  const hash = createHash('sha256').update(normalizedPath).digest('hex');
  return path.join(LOCK_ROOT_DIR, `${hash}.lock`);
}

function getSessionMap(sessionId: string): Map<string, number> {
  let sessionMap = sessionHoldCounts.get(sessionId);
  if (!sessionMap) {
    sessionMap = new Map();
    sessionHoldCounts.set(sessionId, sessionMap);
  }
  return sessionMap;
}

function makeCallKey(sessionId: string, tool: string, callId: string | undefined): string {
  const safeCall = callId ?? 'unknown-call';
  return `${sessionId}:${tool}:${safeCall}`;
}

function isErrnoException(error: unknown): error is NodeJS.ErrnoException {
  return Boolean(error) && typeof error === 'object' && 'code' in error;
}

async function ensureLockDir(): Promise<void> {
  await fsp.mkdir(LOCK_ROOT_DIR, { recursive: true });
}

async function readLockFile(lockPath: string): Promise<DiskLock | null> {
  try {
    const content = await fsp.readFile(lockPath, 'utf8');
    const parsed = JSON.parse(content) as Partial<DiskLock>;
    if (
      typeof parsed.sessionId === 'string' &&
      typeof parsed.timestamp === 'number' &&
      typeof parsed.normalizedPath === 'string'
    ) {
      return {
        sessionId: parsed.sessionId,
        timestamp: parsed.timestamp,
        normalizedPath: parsed.normalizedPath,
        agentId: typeof parsed.agentId === 'string' ? parsed.agentId : undefined,
      };
    }
  } catch (error) {
    if (isErrnoException(error) && error.code === 'ENOENT') {
      return null;
    }
  }
  return null;
}

async function writeLockFile(lockPath: string, lock: DiskLock): Promise<void> {
  const payload = JSON.stringify(lock);
  await fsp.writeFile(lockPath, payload, { encoding: 'utf8', flag: 'wx' });
}

async function removeLockFile(lockPath: string): Promise<void> {
  try {
    await fsp.unlink(lockPath);
  } catch (error) {
    if (!isErrnoException(error) || error.code !== 'ENOENT') {
      throw error;
    }
  }
}

function isLockExpired(lock: DiskLock): boolean {
  return Date.now() - lock.timestamp > LOCK_TIMEOUT_MS;
}

async function cleanupExpiredLocks(): Promise<void> {
  let entries: readonly string[];
  try {
    entries = await fsp.readdir(LOCK_ROOT_DIR);
  } catch (error) {
    if (isErrnoException(error) && error.code === 'ENOENT') {
      return;
    }
    throw error;
  }

  await Promise.all(
    entries
      .filter((entry) => entry.endsWith('.lock'))
      .map(async (entry) => {
        const lockPath = path.join(LOCK_ROOT_DIR, entry);
        const info = await readLockFile(lockPath);
        if (!info || isLockExpired(info)) {
          await removeLockFile(lockPath);
        }
      }),
  );
}

function calculateTimeRemaining(timestamp: number): number {
  const remaining = LOCK_TIMEOUT_MS - (Date.now() - timestamp);
  return Math.max(0, remaining);
}

function formatTimeRemaining(ms: number): string {
  const minutes = Math.ceil(ms / (60 * 1000));
  return `${minutes} minutes`;
}

function createLockErrorMessage(filePath: string, lockInfo: DiskLock): string {
  const sessionShort = lockInfo.sessionId.substring(0, 8);
  const timeRemaining = formatTimeRemaining(calculateTimeRemaining(lockInfo.timestamp));
  const agentLabel = lockInfo.agentId ? lockInfo.agentId : 'unknown';
  return (
    `File ${filePath} is locked by another agent (session: ${sessionShort}..., agent: ${agentLabel}). ` +
    `Lock expires in ${timeRemaining}.`
  );
}

async function acquireDiskLock(
  sessionId: string,
  filePath: string,
  agentId: string | undefined,
): Promise<string> {
  const normalizedPath = normalizePath(filePath);
  const lockPath = makeLockFilePath(normalizedPath);
  const sessionMap = getSessionMap(sessionId);
  const currentCount = sessionMap.get(normalizedPath) ?? 0;

  if (currentCount > 0) {
    sessionMap.set(normalizedPath, currentCount + 1);
    return normalizedPath;
  }

  await ensureLockDir();
  await cleanupExpiredLocks();

  for (;;) {
    const existingLock = await readLockFile(lockPath);
    if (existingLock) {
      if (existingLock.sessionId === sessionId) {
        sessionMap.set(normalizedPath, currentCount + 1);
        return normalizedPath;
      }

      if (!isLockExpired(existingLock)) {
        throw new Error(createLockErrorMessage(filePath, existingLock));
      }

      await removeLockFile(lockPath);
      continue;
    }

    const lock: DiskLock = {
      sessionId,
      timestamp: Date.now(),
      agentId,
      normalizedPath,
    };

    try {
      await writeLockFile(lockPath, lock);
      sessionMap.set(normalizedPath, 1);
      return normalizedPath;
    } catch (error) {
      if (isErrnoException(error) && error.code === 'EEXIST') {
        continue;
      }
      throw new Error(`Failed to acquire lock for file ${filePath}: ${String(error)}`);
    }
  }
}

async function releaseDiskLock(sessionId: string, normalizedPath: string): Promise<void> {
  const sessionMap = sessionHoldCounts.get(sessionId);
  if (!sessionMap) return;

  const currentCount = sessionMap.get(normalizedPath);
  if (!currentCount) return;

  if (currentCount > 1) {
    sessionMap.set(normalizedPath, currentCount - 1);
    return;
  }

  sessionMap.delete(normalizedPath);
  if (sessionMap.size === 0) {
    sessionHoldCounts.delete(sessionId);
  }

  const lockPath = makeLockFilePath(normalizedPath);
  const existingLock = await readLockFile(lockPath);
  if (existingLock && existingLock.sessionId !== sessionId && !isLockExpired(existingLock)) {
    return;
  }

  await removeLockFile(lockPath);
}

async function releaseAllLocks(sessionId: string): Promise<void> {
  const sessionMap = sessionHoldCounts.get(sessionId);
  if (!sessionMap) return;

  const paths = Array.from(sessionMap.keys());
  for (const normalizedPath of paths) {
    // Reset to single reference so release removes the file.
    sessionMap.set(normalizedPath, 1);
    await releaseDiskLock(sessionId, normalizedPath);
  }

  sessionHoldCounts.delete(sessionId);

  const callKeys = Array.from(callLocks.keys()).filter((key) => key.startsWith(`${sessionId}:`));
  callKeys.forEach((key) => callLocks.delete(key));
}

function getFilePathFromArgs(args: Record<string, unknown>): string | null {
  const candidates = ['filePath', 'relative_path'];
  for (const candidate of candidates) {
    const value = args[candidate];
    if (typeof value === 'string') {
      return value;
    }
  }
  return null;
}

function isWriteOperation(toolName: string): boolean {
  return WRITE_TOOLS.has(toolName);
}

export const FileLockPlugin: Plugin = async (pluginInput) => {
  const sessionId = Math.random().toString(36).slice(2);
  let agentId: string | undefined;
  if (pluginInput && typeof pluginInput === 'object') {
    const candidate = pluginInput as Record<string, unknown>;
    if (typeof candidate.agentID === 'string') {
      agentId = candidate.agentID;
    } else if (typeof candidate.agentId === 'string') {
      agentId = candidate.agentId;
    }
  }

  return {
    async 'tool.execute.before'(input, output) {
      if (!isWriteOperation(input.tool)) return;

      const filePath = getFilePathFromArgs(output.args as Record<string, unknown>);
      if (!filePath) return;

      const callKey = makeCallKey(sessionId, input.tool, input.callID);
      if (callLocks.has(callKey)) {
        return;
      }

      const normalizedPath = await acquireDiskLock(sessionId, filePath, agentId);
      callLocks.set(callKey, { normalizedPath });
    },

    async 'tool.execute.after'(input) {
      if (!isWriteOperation(input.tool)) return;

      const callKey = makeCallKey(sessionId, input.tool, input.callID);
      const activeLock = callLocks.get(callKey);
      if (!activeLock) return;

      await releaseDiskLock(sessionId, activeLock.normalizedPath);
      callLocks.delete(callKey);
    },

    async 'session.end'() {
      await releaseAllLocks(sessionId);
    },
  };
};
