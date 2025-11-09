# GENERAL AGENT BEHAVIORS

## 🧠 Initiation Sequence
On every request:

1. `context7` → fetch related documentation
2. `github grep` → explore package implementations
3. `web search` → find guides and references
5. `git log` + Opencode session history → review recent events

## IMPORTANT

- Try to keep things in one function unless composable or reusable
- DO NOT do unnecessary destructuring of variables
- DO NOT use `else` statements unless necessary
- DO NOT use `try`/`catch` if it can be avoided
- AVOID `try`/`catch` where possible
- AVOID `else` statements
- AVOID using `any` type
- AVOID `let` statements
- PREFER single word variable names where possible
- Use as many bun apis as possible like Bun.file()

## Tool Calling

- ALWAYS USE PARALLEL TOOLS WHEN APPLICABLE. Here is an example illustrating how to execute 3 parallel file reads in this chat environnement:

json
{
    "recipient_name": "multi_tool_use.parallel",
    "parameters": {
        "tool_uses": [
            {
                "recipient_name": "functions.read",
                "parameters": {
                    "filePath": "path/to/file.tsx"
                }
            },
            {
                "recipient_name": "functions.read",
                "parameters": {
                    "filePath": "path/to/file.ts"
                }
            },
            {
                "recipient_name": "functions.read",
                "parameters": {
                    "filePath": "path/to/file.md"
                }
            }
        ]
    }
}

## Methodology
Think the feature through thoroughly and break the feature down into small steps to produce a detailed,
step-by-step plan for implementing the feature. Group the plan's steps into "phases".
The code MUST build correctly and all tests MUST pass after each phase.


## Initiation sequence
If changes are requested
- fetch changes from remote
- create a new branch based on origin/dev
- create a new worktree in `.worktrees/`
- check out the new branch in the new work tree

## Planning and research

Always start by creating a plan and conducting a thorough investigation
of the code base, and the subject matter to create a plan of action.

### Research tools

Use these tools in any order you see fit to find information related to the prompt:

- Create a planning todo (`todowrite`)
- `context7` → fetch related documentation
- `github grep` → explore package implementations
- `web-search-` → find guides and references
- `bash` commands:
  - `gh issues ...`: are there existing issues similar to this one?
  - `gh pr ...`: Has someone already opened a PR for this?
- `find`, `blob`, `grep` search the local project for code and docs related to the user's query

### (Finalize) the plan
Once you have finished collecting information
- `todowrite` considering the initial prompt, and collected information:
- create a `./spec/*.md` mentioning:
  - code files and line numbers
  - existing issues
  - existing PR
  - definition of done
  - requirements


## Execution

Once you have a plan, begin execution.
Periodically check:
- `todoread`
- the spec files you made, updating them as you work.
  - append commentary as you encounter unexpected unexpected complications
  - append change logs at the end of a session
- commit your work
