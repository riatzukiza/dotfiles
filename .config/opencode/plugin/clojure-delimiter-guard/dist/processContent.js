// SPDX-License-Identifier: GPL-3.0-only
import { checkAndFixDelimiters } from "./checkAndFix";
import { assertString } from "./guards";
/** Pure, reusable processor used by hooks and other tools. */
export function processContent(content, filePath) {
    assertString(content, "content");
    const result = checkAndFixDelimiters(content);
    if (result.errors.length > 0 && !result.changed) {
        const msg = result.errors.map((e) => e.message).join("; ");
        throw new Error(`Delimiter check failed in '${filePath}': ${msg}`);
    }
    if (result.changed) {
        console.log(`✅ Auto-corrected delimiters in '${filePath}'`);
        return result.fixedText;
    }
    return content;
}
//# sourceMappingURL=processContent.js.map