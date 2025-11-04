export const OPENING_SET = new Set(["(", "[", "{"]);
export const CLOSING_TO_OPENING = {
    ")": "(",
    "]": "[",
    "}": "{",
};
export const OPENING_TO_CLOSING = {
    "(": ")",
    "[": "]",
    "{": "}",
};
export function isDelimiter(ch) {
    return (OPENING_SET.has(ch) ||
        ch === ")" || ch === "]" || ch === "}");
}
//# sourceMappingURL=delims.js.map