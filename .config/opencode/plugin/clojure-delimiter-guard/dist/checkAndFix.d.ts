import { Delim } from "./delims";
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
export declare function checkAndFixDelimiters(text: string): FixResult;
//# sourceMappingURL=checkAndFix.d.ts.map