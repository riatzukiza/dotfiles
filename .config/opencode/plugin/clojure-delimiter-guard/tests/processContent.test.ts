// SPDX-License-Identifier: GPL-3.0-only
import test from "ava";
import { processContent } from "../src/processContent.js";

test("processContent returns fixed text on single fix", t => {
  const out = processContent('(inc 1', 'core.cljs');
  t.is(out, '(inc 1)');
});

test("processContent throws on ambiguous multi-error", t => {
  const src = '(foo [1} 2) (bar {3 4]';
  const err = t.throws(() => processContent(src, 'broken.clj'));
  t.true(err instanceof Error);
  t.regex(err!.message, /Delimiter check failed/);
});