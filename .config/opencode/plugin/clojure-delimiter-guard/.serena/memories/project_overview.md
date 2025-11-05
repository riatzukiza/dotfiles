# Clojure Delimiter Guard Project Overview

## Project Purpose
This is a VS Code extension called "clojure-delimiter-guard" that provides bracket pair coloring and delimiter auto-closing for Clojure files. It's built as an OpenCode plugin that hooks into file operations to validate and fix delimiter issues in Clojure code.

## Tech Stack
- **Language**: TypeScript
- **Runtime**: Bun (build tool and package manager)
- **Framework**: OpenCode plugin architecture
- **Testing**: AVA test framework with c8 coverage
- **Build**: TypeScript compilation with ES modules

## Project Structure
```
src/
├── index.ts          # Main plugin entry point
├── guards.ts         # Type guards and assertions
├── delims.ts         # Delimiter type definitions
├── checkAndFix.ts    # Core delimiter validation and fixing logic
└── processContent.ts # Content processing wrapper
```

## Key Features
1. **Delimiter Validation**: Checks for mismatched, unclosed, and unexpected closing delimiters
2. **Auto-fixing**: Automatically fixes common delimiter issues (unclosed openings, mismatches)
3. **Crossing Fix**: Handles crossing closers like "([)]" → "([])"
4. **String/Comment Awareness**: Properly handles string literals and comments
5. **OpenCode Integration**: Hooks into write/edit operations to validate content

## Supported Delimiters
- Basic: `()`, `[]`, `{}`
- String literals: `"..."`
- Comments: `; ... \n`

## Development Commands
- `bun run build` - Build the project
- `bun run dev` - Development mode with watch
- `bun test` - Run tests
- `bun test:coverage` - Run tests with coverage

## Code Style
- Strict TypeScript configuration
- ES modules with bundler resolution
- GPL-3.0 license
- Functional programming approach with pure functions
- Comprehensive error handling with detailed error messages