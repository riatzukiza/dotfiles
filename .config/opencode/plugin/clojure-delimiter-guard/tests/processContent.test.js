"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// SPDX-License-Identifier: GPL-3.0-only
const ava_1 = require("ava");
const processContent_js_1 = require("../src/processContent.js");
(0, ava_1.default)("processContent returns fixed text on single fix", t => {
    const out = (0, processContent_js_1.processContent)('(inc 1', 'core.cljs');
    t.is(out, '(inc 1)');
});
(0, ava_1.default)("processContent throws on ambiguous multi-error", t => {
    const src = '(foo [1} 2) (bar {3 4]';
    const err = t.throws(() => (0, processContent_js_1.processContent)(src, 'broken.clj'));
    t.true(err instanceof Error);
    t.regex(err.message, /Delimiter check failed/);
});
//# sourceMappingURL=processContent.test.js.map