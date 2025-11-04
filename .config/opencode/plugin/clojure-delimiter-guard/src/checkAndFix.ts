// SPDX-License-Identifier: GPL-3.0-only
import {
  Opening, Closing, Delim,
  OPENING_SET, CLOSING_TO_OPENING, OPENING_TO_CLOSING, isDelimiter,
} from "./delims";

export interface ErrorInfo {
  position: number;
  kind: "unexpected-closing" | "mismatch" | "unclosed-opening";
  found: Delim;
  expected?: Delim;
  message: string;
}

export interface FixResult {
  fixedText: string;
  changed: boolean;
  errors: ErrorInfo[];
}

/**
 * Skip a string literal starting at index i (text[i] === '"'), handling escapes.
 * Returns index just after the closing quote (or text.length if unterminated).
 */
function skipString(text: string, i: number): number {
  let j = i + 1;
  let escape = false;
  while (j < text.length) {
    const ch = text[j];
    if (escape) { escape = false; j++; continue; }
    if (ch === "\\") { escape = true; j++; continue; }
    if (ch === '"') return j + 1;
    j++;
  }
  return j;
}

/**
 * A local, conservative fix for crossing closers like "([)]" → "([])".
 * If a mismatch is followed immediately by another closer that *would* match
 * the current opening, swap the two closers.
 */
function tryLocalCrossingFix(text: string, mismatchPos: number, expected: Closing): string | null {
  const a = text[mismatchPos];
  const b = text[mismatchPos + 1];
  if ((a === ")" || a === "]" || a === "}") &&
      (b === ")" || b === "]" || b === "}") &&
      b === expected) {
    return text.slice(0, mismatchPos) + b + a + text.slice(mismatchPos + 2);
  }
  return null;
}

export function checkAndFixDelimiters(text: string): FixResult {
  const stack: { char: Opening; pos: number }[] = [];
  const errors: ErrorInfo[] = [];

  let inComment = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    // line comments ; ... \n
    if (inComment) {
      if (ch === "\n") inComment = false;
      continue;
    }
    if (ch === ";") { inComment = true; continue; }

    // strings "...", with escapes
    if (ch === '"') { i = skipString(text, i) - 1; continue; }

    // delimiter handling (outside strings/comments)
    if (!isDelimiter(ch)) continue;

    if (OPENING_SET.has(ch as Opening)) {
      stack.push({ char: ch as Opening, pos: i });
      continue;
    }

    // closing delimiter
    if (stack.length === 0) {
      errors.push({
        position: i,
        kind: "unexpected-closing",
        found: ch as Delim,
        message: `Unexpected closing '${ch}' at position ${i}, no matching opening.`,
      });
      continue;
    }

    const top = stack[stack.length - 1];
    const expectedOpening = CLOSING_TO_OPENING[ch as Closing];

    if (top.char !== expectedOpening) {
      // try local swap fix ([)] → ([])
      const expectedCloser = OPENING_TO_CLOSING[top.char];
      const swapped = tryLocalCrossingFix(text, i, expectedCloser);
      if (swapped) {
        // re-run once with swapped text: cheap single-pass retry
        return checkAndFixDelimiters(swapped);
      }
      errors.push({
        position: i,
        kind: "mismatch",
        found: ch as Delim,
        expected: expectedCloser,
        message: `Mismatched delimiter at pos ${i}: expected closing '${expectedCloser}' for opening '${top.char}' at ${top.pos}, but found '${ch}'.`,
      });
      stack.pop(); // drop the opening so we don't cascade on this frame
    } else {
      stack.pop();
    }
  }

  // any leftovers are unclosed openings
  for (const leftover of stack) {
    errors.push({
      position: leftover.pos,
      kind: "unclosed-opening",
      found: leftover.char,
      expected: OPENING_TO_CLOSING[leftover.char],
      message: `Unclosed opening '${leftover.char}' at position ${leftover.pos}, expected closing '${OPENING_TO_CLOSING[leftover.char]}'.`,
    });
  }

  // no problems
  if (errors.length === 0) {
    return { fixedText: text, changed: false, errors: [] };
  }

  // single obvious fix
  if (errors.length === 1) {
    const e = errors[0];
    if (e.kind === "unclosed-opening" && e.expected) {
      return { fixedText: text + e.expected, changed: true, errors: [] };
    }
    if (e.kind === "mismatch" && e.expected) {
      const pos = e.position;
      const fixedText = text.slice(0, pos) + e.expected + text.slice(pos + 1);
      return { fixedText, changed: true, errors: [] };
    }
  }

  // ambiguous or multi-error: report, do not change
  return { fixedText: text, changed: false, errors };
}