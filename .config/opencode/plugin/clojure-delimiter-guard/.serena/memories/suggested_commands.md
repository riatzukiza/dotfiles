# Suggested Commands for Clojure Delimiter Guard Development

## Build and Development
```bash
bun run build          # Build the project for production
bun run dev            # Start development with file watching
bun run test           # Run all tests
bun run test:coverage  # Run tests with coverage report
```

## Project Management
```bash
bun install            # Install dependencies
bun update             # Update dependencies
```

## File Operations
```bash
find . -name "*.ts"    # List all TypeScript files
grep -r "delimiter" src/  # Search for delimiter-related code
```

## Testing
```bash
bun test src/checkAndFix.test.ts  # Run specific test file
bun test --coverage                # Generate coverage report
```

## Build Output
```bash
ls -la dist/          # Check build output
cat dist/index.js     # View compiled output
```

## Git Operations
```bash
git status            # Check git status
git add .             # Stage all changes
git commit -m "msg"   # Commit changes
```