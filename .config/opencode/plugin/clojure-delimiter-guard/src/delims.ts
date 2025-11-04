// SPDX-License-Identifier: GPL-3.0-only
export type Opening = "(" | "[" | "{";
export type Closing = ")" | "]" | "}";
export type Delim = Opening | Closing;

export const OPENING_SET = new Set<Opening>(["(", "[", "{"]);

export const CLOSING_TO_OPENING: Record<Closing, Opening> = {
  ")": "(",
  "]": "[",
  "}": "{",
};

export const OPENING_TO_CLOSING: Record<Opening, Closing> = {
  "(": ")",
  "[": "]",
  "{": "}",
};

export function isDelimiter(ch: string): ch is Delim {
  return (
    OPENING_SET.has(ch as Opening) ||
    ch === ")" || ch === "]" || ch === "}"
  );
}