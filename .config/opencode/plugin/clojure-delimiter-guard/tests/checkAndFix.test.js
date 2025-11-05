"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// SPDX-License-Identifier: GPL-3.0-only
const ava_1 = require("ava");
const checkAndFix_js_1 = require("../src/checkAndFix.js");
(0, ava_1.default)("passes balanced forms", t => {
    const src = '(defn foo [x] {:ok true :xs [1 2 (inc x)]})';
    const res = (0, checkAndFix_js_1.checkAndFixDelimiters)(src);
    t.false(res.changed);
    t.is(res.fixedText, src);
    t.deepEqual(res.errors, []);
});
(0, ava_1.default)("appends missing closing", t => {
    const src = '(defn foo [x] (inc x)';
    const res = (0, checkAndFix_js_1.checkAndFixDelimiters)(src);
    t.true(res.changed);
    t.is(res.fixedText, src + ')');
    t.deepEqual(res.errors, []);
});
(0, ava_1.default)("fixes mismatched closing", t => {
    const src = '(foo [1 2 3})';
    const res = (0, checkAndFix_js_1.checkAndFixDelimiters)(src);
    t.true(res.changed);
    t.is(res.fixedText, '(foo [1 2 3])');
});
(0, ava_1.default)("fixes simple crossing pair ([)] -> ([])", t => {
    const src = '([)]';
    const res = (0, checkAndFix_js_1.checkAndFixDelimiters)(src);
    t.true(res.changed);
    t.is(res.fixedText, '([])');
});
(0, ava_1.default)("ignores delimiters inside strings", t => {
    const src = '(println "not [real} parens")';
    const res = (0, checkAndFix_js_1.checkAndFixDelimiters)(src);
    t.false(res.changed);
    t.is(res.fixedText, src);
});
(0, ava_1.default)("ignores delimiters in ; comments", t => {
    const src = '(+ 1 2) ; )] not real';
    const res = (0, checkAndFix_js_1.checkAndFixDelimiters)(src);
    t.false(res.changed);
    t.is(res.fixedText, src);
});
(0, ava_1.default)("reports multi-error without change", t => {
    const src = '(foo [1 2 3} bar {4 5 6';
    const res = (0, checkAndFix_js_1.checkAndFixDelimiters)(src);
    t.false(res.changed);
    t.true(res.errors.length > 1);
    t.is(res.fixedText, src);
});
//# sourceMappingURL=checkAndFix.test.js.map