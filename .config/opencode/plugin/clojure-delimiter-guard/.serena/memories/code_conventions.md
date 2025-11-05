# Code Conventions for Clojure Delimiter Guard

## TypeScript Configuration
- Strict mode enabled
- ES2022 target with ESNext modules
- Bundler module resolution
- Declaration files generated

## Naming Conventions
- **Files**: kebab-case (e.g., `checkAndFix.ts`)
- **Functions**: camelCase (e.g., `processContent`, `checkAndFixDelimiters`)
- **Types**: PascalCase (e.g., `Opening`, `Closing`, `Delim`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `OPENING_SET`, `CLOSING_TO_OPENING`)
- **Interfaces**: PascalCase with descriptive names (e.g., `ErrorInfo`, `FixResult`)

## Code Style
- Functional programming approach with pure functions
- Comprehensive type annotations
- Detailed error messages with position information
- Single responsibility principle for each function
- Immutable data structures where possible

## Documentation
- SPDX license headers in all files
- JSDoc comments for public functions
- Clear parameter and return type descriptions
- Inline comments for complex logic

## Error Handling
- Custom error types with detailed information
- Position-aware error reporting
- Graceful degradation for ambiguous cases
- Validation through type guards and assertions

## Testing
- Comprehensive test coverage for all functions
- Edge case testing for delimiter scenarios
- Integration tests for plugin hooks