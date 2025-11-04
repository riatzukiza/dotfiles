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

function checkAndFixDelimiters(text: string): FixResult {
  const stack: { char: Opening; pos: number }[] = []
  const errors: ErrorInfo[] = []

  for (let i = 0; i < text.length; i++) {
    const ch = text[i] as Delim
    
    if (openingSet.has(ch as Opening)) {
      stack.push({ char: ch as Opening, pos: i })
    } else if (ch === ")" || ch === "]" || ch === "}") {
      if (stack.length === 0) {
        errors.push({
          position: i,
          kind: "unexpected-closing",
          found: ch,
          message: `Unexpected closing '${ch}' at position ${i}, no matching opening.`,
        })
      } else {
        const top = stack[stack.length - 1]
        const expectedOpening = closingToOpening[ch]
        if (top.char !== expectedOpening) {
          errors.push({
            position: i,
            kind: "mismatch",
            found: ch,
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
          const content = output.args.content as string
          const result = checkAndFixDelimiters(content)
          
          if (result.errors.length > 0 && !result.changed) {
            throw new Error(`Delimiter check failed in '${filePath}': ${result.errors.map(e => e.message).join("; ")}`)
          }
          
          if (result.changed) {
            output.args.content = result.fixedText
            console.log(`✅ Auto-corrected delimiters in '${filePath}'`)
          }
        }
      }
      
      if (input.tool === "edit" && output.args.filePath) {
        const filePath = output.args.filePath as string
        if (isClojureFile(filePath)) {
          const newString = output.args.newString as string
          const result = checkAndFixDelimiters(newString)
          
          if (result.errors.length > 0 && !result.changed) {
            throw new Error(`Delimiter check failed in '${filePath}': ${result.errors.map(e => e.message).join("; ")}`)
          }
          
          if (result.changed) {
            output.args.newString = result.fixedText
            console.log(`✅ Auto-corrected delimiters in edit for '${filePath}'`)
          }
        }
      }
    },
  }
}