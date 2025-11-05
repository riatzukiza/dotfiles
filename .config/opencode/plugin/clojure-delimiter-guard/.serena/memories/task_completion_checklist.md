# Task Completion Checklist

## Before Finishing Any Task
1. **Build Verification**: Run `bun run build` to ensure code compiles
2. **Test Execution**: Run `bun test` to verify all tests pass
3. **Type Checking**: Ensure TypeScript compilation succeeds without errors
4. **Code Review**: Check adherence to project conventions
5. **Documentation**: Update relevant documentation if needed

## Specific for Delimiter Features
1. **Test Edge Cases**: Verify string literals, comments, and nested delimiters
2. **Error Messages**: Ensure error messages are clear and include positions
3. **Performance**: Check that processing is efficient for large files
4. **Integration**: Verify OpenCode plugin hooks work correctly

## Quality Gates
- No TypeScript compilation errors
- All tests passing with good coverage
- Code follows established conventions
- Error handling is comprehensive
- Performance is acceptable for typical file sizes

## Final Verification
```bash
bun run build && bun test
```

Only consider a task complete when all these checks pass.