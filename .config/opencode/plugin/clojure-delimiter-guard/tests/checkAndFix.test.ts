// SPDX-License-Identifier: GPL-3.0-only
import test from "ava";
import { checkAndFixDelimiters } from "../src/checkAndFix.js";

test("passes balanced forms", t => {
  const src = '(defn foo [x] {:ok true :xs [1 2 (inc x)]})';
  const res = checkAndFixDelimiters(src);
  t.false(res.changed);
  t.is(res.fixedText, src);
  t.deepEqual(res.errors, []);
});

test("appends missing closing", t => {
  const src = '(defn foo [x] (inc x)';
  const res = checkAndFixDelimiters(src);
  t.true(res.changed);
  t.is(res.fixedText, src + ')');
  t.deepEqual(res.errors, []);
});

test("fixes mismatched closing", t => {
  const src = '(foo [1 2 3})';
  const res = checkAndFixDelimiters(src);
  t.true(res.changed);
  t.is(res.fixedText, '(foo [1 2 3])');
});

test("fixes simple crossing pair ([)] -> ([])", t => {
  const src = '([)]';
  const res = checkAndFixDelimiters(src);
  t.true(res.changed);
  t.is(res.fixedText, '([])');
});

test("ignores delimiters inside strings", t => {
  const src = '(println "not [real} parens")';
  const res = checkAndFixDelimiters(src);
  t.false(res.changed);
  t.is(res.fixedText, src);
});

test("ignores delimiters in ; comments", t => {
  const src = '(+ 1 2) ; )] not real';
  const res = checkAndFixDelimiters(src);
  t.false(res.changed);
  t.is(res.fixedText, src);
});

test("reports multi-error without change", t => {
  const src = '(foo [1 2 3} bar {4 5 6';
  const res = checkAndFixDelimiters(src);
  t.false(res.changed);
  t.true(res.errors.length > 1);
  t.is(res.fixedText, src);
});