// src/guards.ts
function assertString(value, name) {
  if (typeof value !== "string") {
    throw new TypeError(`Expected '${name}' to be string, got ${typeof value}`);
  }
}
function assertNonEmptyString(value, name) {
  if (typeof value !== "string" || value.length === 0) {
    throw new TypeError(`Expected '${name}' to be non-empty string`);
  }
}
function isClojureFile(path) {
  return typeof path === "string" && /\.(clj|cljs|cljc)$/.test(path);
}

// src/delims.ts
var OPENING_SET = new Set(["(", "[", "{"]);
var CLOSING_TO_OPENING = {
  ")": "(",
  "]": "[",
  "}": "{"
};
var OPENING_TO_CLOSING = {
  "(": ")",
  "[": "]",
  "{": "}"
};
function isDelimiter(ch) {
  return OPENING_SET.has(ch) || ch === ")" || ch === "]" || ch === "}";
}

// src/checkAndFix.ts
function skipString(text, i) {
  let j = i + 1;
  let escape = false;
  while (j < text.length) {
    const ch = text[j];
    if (escape) {
      escape = false;
      j++;
      continue;
    }
    if (ch === "\\") {
      escape = true;
      j++;
      continue;
    }
    if (ch === '"')
      return j + 1;
    j++;
  }
  return j;
}
function tryLocalCrossingFix(text, mismatchPos, expected) {
  const a = text[mismatchPos];
  const b = text[mismatchPos + 1];
  if ((a === ")" || a === "]" || a === "}") && (b === ")" || b === "]" || b === "}") && b === expected) {
    return text.slice(0, mismatchPos) + b + a + text.slice(mismatchPos + 2);
  }
  return null;
}
function checkAndFixDelimiters(text) {
  const stack = [];
  const errors = [];
  let inComment = false;
  for (let i = 0;i < text.length; i++) {
    const ch = text[i];
    if (inComment) {
      if (ch === `
`)
        inComment = false;
      continue;
    }
    if (ch === ";") {
      inComment = true;
      continue;
    }
    if (ch === '"') {
      i = skipString(text, i) - 1;
      continue;
    }
    if (!isDelimiter(ch))
      continue;
    if (OPENING_SET.has(ch)) {
      stack.push({ char: ch, pos: i });
      continue;
    }
    if (stack.length === 0) {
      errors.push({
        position: i,
        kind: "unexpected-closing",
        found: ch,
        message: `Unexpected closing '${ch}' at position ${i}, no matching opening.`
      });
      continue;
    }
    const top = stack[stack.length - 1];
    const expectedOpening = CLOSING_TO_OPENING[ch];
    if (top.char !== expectedOpening) {
      const expectedCloser = OPENING_TO_CLOSING[top.char];
      const swapped = tryLocalCrossingFix(text, i, expectedCloser);
      if (swapped) {
        return checkAndFixDelimiters(swapped);
      }
      errors.push({
        position: i,
        kind: "mismatch",
        found: ch,
        expected: expectedCloser,
        message: `Mismatched delimiter at pos ${i}: expected closing '${expectedCloser}' for opening '${top.char}' at ${top.pos}, but found '${ch}'.`
      });
      stack.pop();
    } else {
      stack.pop();
    }
  }
  for (const leftover of stack) {
    errors.push({
      position: leftover.pos,
      kind: "unclosed-opening",
      found: leftover.char,
      expected: OPENING_TO_CLOSING[leftover.char],
      message: `Unclosed opening '${leftover.char}' at position ${leftover.pos}, expected closing '${OPENING_TO_CLOSING[leftover.char]}'.`
    });
  }
  if (errors.length === 0) {
    return { fixedText: text, changed: false, errors: [] };
  }
  if (errors.length === 1) {
    const e = errors[0];
    if (e.kind === "unclosed-opening" && e.expected) {
      return { fixedText: text + e.expected, changed: true, errors: [] };
    }
    if (e.kind === "mismatch" && e.expected) {
      const pos = e.position;
      const fixedText = text.slice(0, pos) + e.expected + text.slice(pos + 1);
      return { fixedText, changed: true, errors: [] };
    }
  }
  return { fixedText: text, changed: false, errors };
}

// src/processContent.ts
function processContent(content, filePath) {
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

// src/index.ts
var ClojureDelimiterChecker = async () => {
  return {
    "tool.execute.before": async (input, output) => {
      const fp = output?.args?.filePath;
      if (!isClojureFile(fp))
        return;
      if (input.tool === "write") {
        const c = output.args?.content;
        assertNonEmptyString(fp, "filePath");
        output.args.content = processContent(c, fp);
      }
      if (input.tool === "edit") {
        const ns = output.args?.newString;
        assertNonEmptyString(fp, "filePath");
        output.args.newString = processContent(ns, fp);
      }
    }
  };
};
export {
  ClojureDelimiterChecker
};
