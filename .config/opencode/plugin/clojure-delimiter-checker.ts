// SPDX-License-Identifier: MIT
import type { Plugin } from "@opencode-ai/plugin"

type Opening = "(" | "[" | "{"
type Closing = ")" | "]" | "}"
type Delim = Opening | Closing

interface ErrorInfo {
  position: number
  kind: "unexpected-closing" | "mismatch" | "unclosed-opening"
  found: Delim
  expected?: Delim
  message: string
}

interface FixResult {
  fixedText: string
  changed: boolean
  errors: ErrorInfo[]
}

const openingSet = new Set<Opening>(["(", "[", "{"])
const closingToOpening: Record<Closing, Opening> = {
  ")": "(",
  "]": "[",
  "}": "{",
}
const openingToClosing: Record<Opening, Closing> = {
  "(": ")",
  "[": "]",
  "{": "}",
}

function isClojureFile(filePath: string): boolean {
  return /\.(clj|cljs|cljc)$/.test(filePath)
}

function isDelimiter(char: string): char is Delim {
  return openingSet.has(char as Opening) || char === ')' || char === ']' || char === '}'
}

function processContent(content: string, filePath: string): string {
  if (typeof content !== 'string') {
    throw new Error(`Expected string content for file '${filePath}', got ${typeof content}`)
  }
  
  const result = checkAndFixDelimiters(content)
  
  if (result.errors.length > 0 && !result.changed) {
    throw new Error(`Delimiter check failed in '${filePath}': ${result.errors.map(e => e.message).join("; ")}`)
  }
  
  if (result.changed) {
    console.log(`✅ Auto-corrected delimiters in '${filePath}'`)
    return result.fixedText
  }
  
  return content
}

function checkAndFixDelimiters(text: string): FixResult {
  if (typeof text !== 'string') {
    throw new Error(`Expected string input, got ${typeof text}`)
  }
  
  const stack: { char: Opening; pos: number }[] = []
  const errors: ErrorInfo[] = []
  let inString = false
  let inComment = false
  let escapeNext = false

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    
    // Handle string literals and comments
    if (escapeNext) {
      escapeNext = false
      continue
    }
    
    if (ch === '\\') {
      escapeNext = true
      continue
    }
    
    if (ch === '"' && !inComment) {
      inString = !inString
      continue
    }
    
    if (ch === ';' && !inString) {
      inComment = true
      continue
    }
    
    if (ch === '\n' && inComment) {
      inComment = false
      continue
    }
    
    // Skip delimiter processing inside strings and comments
    if (inString || inComment) {
      continue
    }
    
    if (isDelimiter(ch)) {
      if (openingSet.has(ch as Opening)) {
        stack.push({ char: ch as Opening, pos: i })
      } else if (ch === ")" || ch === "]" || ch === "}") {
        if (stack.length === 0) {
          errors.push({
            position: i,
            kind: "unexpected-closing",
            found: ch as Delim,
            message: `Unexpected closing '${ch}' at position ${i}, no matching opening.`,
          })
        } else {
          const top = stack[stack.length - 1]
          const expectedOpening = closingToOpening[ch as Closing]
          if (top.char !== expectedOpening) {
            errors.push({
              position: i,
              kind: "mismatch",
              found: ch as Delim,
              expected: openingToClosing[top.char],
              message: `Mismatched delimiter at pos ${i}: expected closing '${openingToClosing[top.char]}' for opening '${top.char}' at ${top.pos}, but found '${ch}'.`,
            })
            stack.pop()
          } else {
            stack.pop()
          }
        }
      }
    }
  }

  if (stack.length > 0) {
    for (const leftover of stack) {
      errors.push({
        position: leftover.pos,
        kind: "unclosed-opening",
        found: leftover.char,
        expected: openingToClosing[leftover.char],
        message: `Unclosed opening '${leftover.char}' at position ${leftover.pos}, expected closing '${openingToClosing[leftover.char]}'.`,
      })
    }
  }

  if (errors.length === 0) {
    return { fixedText: text, changed: false, errors: [] }
  }

  if (errors.length === 1) {
    const e = errors[0]
    if (e.kind === "unclosed-opening") {
      const closing = e.expected as Delim
      return { fixedText: text + closing, changed: true, errors: [] }
    }
    if (e.kind === "mismatch") {
      const pos = e.position
      const expectedClosing = e.expected as Delim
      const fixedText = text.slice(0, pos) + expectedClosing + text.slice(pos + 1)
      return { fixedText, changed: true, errors: [] }
    }
  }

  return { fixedText: text, changed: false, errors }
}

export const ClojureDelimiterChecker: Plugin = async ({ client, project, directory, worktree, $ }) => {
  return {
    "tool.execute.before": async (input, output) => {
      if (input.tool === "write" && output.args.filePath) {
        const filePath = output.args.filePath as string
        if (isClojureFile(filePath)) {
          output.args.content = processContent(output.args.content, filePath)
        }
      }
      
      if (input.tool === "edit" && output.args.filePath) {
        const filePath = output.args.filePath as string
        if (isClojureFile(filePath)) {
          output.args.newString = processContent(output.args.newString, filePath)
        }
      }
    },
  }
}