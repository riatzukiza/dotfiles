// SPDX-License-Identifier: GPL-3.0-only
export function assertString(value, name) {
    if (typeof value !== "string") {
        throw new TypeError(`Expected '${name}' to be string, got ${typeof value}`);
    }
}
export function assertNonEmptyString(value, name) {
    if (typeof value !== "string" || value.length === 0) {
        throw new TypeError(`Expected '${name}' to be non-empty string`);
    }
}
export function isClojureFile(path) {
    return typeof path === "string" && /\.(clj|cljs|cljc)$/.test(path);
}
//# sourceMappingURL=guards.js.map