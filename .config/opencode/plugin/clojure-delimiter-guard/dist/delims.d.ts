export type Opening = "(" | "[" | "{";
export type Closing = ")" | "]" | "}";
export type Delim = Opening | Closing;
export declare const OPENING_SET: Set<Opening>;
export declare const CLOSING_TO_OPENING: Record<Closing, Opening>;
export declare const OPENING_TO_CLOSING: Record<Opening, Closing>;
export declare function isDelimiter(ch: string): ch is Delim;
//# sourceMappingURL=delims.d.ts.map