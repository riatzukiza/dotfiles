import type { Plugin } from "@opencode-ai/plugin";
import { randomUUID } from "node:crypto";
import { promises as fsp } from "node:fs";
import { tmpdir } from "node:os";
import * as path from "node:path";

const LOCK_TTL_MS = 5 * 60 * 1000; // 5 minutes
const CACHE_DIR = path.join(tmpdir(), "opencode", "file-locks");

const WRITE_OPERATION_CONFIG = {
  exactMatches: [
    "write",
    "edit",
    "create",
    "mkdir",
    "touch",
    "cp",
    "mv",
    "rm",
    "serena_create_text_file",
    "serena_replace_regex",
    "serena_replace_symbol_body",
    "serena_insert_before_symbol",
    "serena_insert_after_symbol",
  ],
  patterns: [
    /create.*file/i,
    /write.*file/i,
    /edit.*file/i,
    /replace.*file/i,
    /insert.*file/i,
    /delete.*file/i,
    /update.*file/i,
  ],
  exclusions: ["read", "list", "get", "find", "search", "view", "show", "inspect"],
} as const;

type LockRecord = Readonly<{
  sessionId: string;
  timestamp: number;
  agentId?: string;
}>;

type ActiveCallLock = Readonly<{
  normalizedPath: string;
}>;

const activeLocks = new Map<string, LockRecord>();
const callLocks = new Map<string, ActiveCallLock>();

let globalSessionId: string | undefined;

const ensureCacheDir = (() => {
  let ready: Promise<void> | undefined;
  return async () => {
    if (!ready) {
      ready = fsp.mkdir(CACHE_DIR, { recursive: true }).then(() => undefined);
    }
    await ready;
  };
})();

function normalizePath(filePath: string): string {
  return filePath.replace(/\\/g, "/").normalize();
}

function getSessionId(): string {
  if (!globalSessionId) {
    globalSessionId = randomUUID();
  }
  return globalSessionId;
}

function makeCallKey(tool: string, callId: string | undefined): string {
  const safeCall = callId ?? "unknown-call";
  return `${tool}:${safeCall}`;
}

function computeTimeRemaining(lock: LockRecord): number {
  const expiresAt = lock.timestamp + LOCK_TTL_MS;
  return Math.max(0, expiresAt - Date.now());
}

function formatTimeRemaining(ms: number): string {
  const minutes = Math.ceil(ms / (60 * 1000));
  return `${minutes} minutes`;
}

function createLockErrorMessage(filePath: string, lock: LockRecord): string {
  const sessionShort = lock.sessionId.slice(0, 8);
  const timeRemaining = formatTimeRemaining(computeTimeRemaining(lock));
  const agentLabel = lock.agentId ?? "unknown";
  return (
    `File ${filePath} is locked by another session (session: ${sessionShort}..., agent: ${agentLabel}). ` +
    `Lock expires in ${timeRemaining}.`
  );
}

const cachedWritePatterns = WRITE_OPERATION_CONFIG.patterns;

function isWriteOperation(toolName: string): boolean {
  const normalized = toolName.toLowerCase();
  if (
    WRITE_OPERATION_CONFIG.exclusions.some((prefix) =>
      normalized.startsWith(prefix),
    )
  ) {
    return false;
  }

  if (
    WRITE_OPERATION_CONFIG.exactMatches.some(
      (candidate) => candidate === normalized,
    )
  ) {
    return true;
  }

  return cachedWritePatterns.some((pattern) => pattern.test(normalized));
}

function extractFilePath(args: unknown): string | null {
  if (!args || typeof args !== "object") {
    return null;
  }

  const record = args as Record<string, unknown>;
  const candidates = ["filePath", "relative_path"];
  for (const candidate of candidates) {
    const value = record[candidate];
    if (typeof value === "string") {
      return value;
    }
  }

  return null;
}

async function acquireLock(
  filePath: string,
  agentId: string | undefined,
  sessionId: string,
): Promise<string> {
  await ensureCacheDir();
  const normalizedPath = normalizePath(filePath);

  // Check if file is already locked
  const existingLock = activeLocks.get(normalizedPath);
  if (existingLock) {
    // Same session can access files it already has locks for
    if (existingLock.sessionId === sessionId) {
      return normalizedPath;
    }
    
    // Different session has the lock - check expiration
    if (computeTimeRemaining(existingLock) > 0) {
      throw new Error(createLockErrorMessage(filePath, existingLock));
    }
    
    // Lock expired, remove it
    activeLocks.delete(normalizedPath);
  }

  // Create new lock record
  const record: LockRecord = {
    sessionId,
    timestamp: Date.now(),
    agentId,
  };

  activeLocks.set(normalizedPath, record);
  return normalizedPath;
}

async function releaseLock(
  normalizedPath: string,
  sessionId: string,
): Promise<void> {
  const existingLock = activeLocks.get(normalizedPath);
  if (!existingLock) {
    return;
  }

  // Only the session that owns the lock can release it
  if (existingLock.sessionId !== sessionId) {
    return;
  }

  activeLocks.delete(normalizedPath);
}

async function releaseAllLocks(sessionId: string): Promise<void> {
  // Release all locks owned by this session
  const locksToRemove: string[] = [];
  for (const [path, lock] of activeLocks.entries()) {
    if (lock.sessionId === sessionId) {
      locksToRemove.push(path);
    }
  }
  
  for (const path of locksToRemove) {
    activeLocks.delete(path);
  }

  callLocks.clear();
}

export const FileLockPlugin: Plugin = async (pluginInput) => {
  const sessionId = getSessionId();
  let agentId: string | undefined;

  if (pluginInput && typeof pluginInput === "object") {
    const candidate = pluginInput as Record<string, unknown>;
    const maybeAgent = candidate.agentID ?? candidate.agentId;
    if (typeof maybeAgent === "string") {
      agentId = maybeAgent;
    }
  }

  return {
    async "tool.execute.before"(input, output) {
      if (!isWriteOperation(input.tool)) {
        return;
      }

      const filePath = extractFilePath(output.args);
      if (!filePath) {
        return;
      }

      const callKey = makeCallKey(input.tool, input.callID);
      if (callLocks.has(callKey)) {
        return;
      }

      const normalizedPath = await acquireLock(filePath, agentId, sessionId);
      callLocks.set(callKey, { normalizedPath });
    },

    async "tool.execute.after"(input) {
      if (!isWriteOperation(input.tool)) {
        return;
      }

      const callKey = makeCallKey(input.tool, input.callID);
      const activeLock = callLocks.get(callKey);
      if (!activeLock) {
        return;
      }

      await releaseLock(activeLock.normalizedPath, sessionId);
      callLocks.delete(callKey);
    },

    async "session.end"() {
      await releaseAllLocks(sessionId).catch(() => undefined);
    },
  };
};