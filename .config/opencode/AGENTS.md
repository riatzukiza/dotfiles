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

## 🧠 Initiation Sequence
- allow `serena` to guide you
- regularly `serena_think_about_task_adherance`

### Serena
1. `serena_check_onboarding_performed`
   - perform `serena_onboarding` if not
2. `serena_activate_project`
3. `serena_prepare_for_new_conversation`
4. `serena_list_memories`

## Planning and research

Always start by creating a plan and conducting a thorough investigation
of the code base, and the subject matter to create a plan of action.

### Research tools

Use these tools in any order you see fit to find information related to the prompt:

- Create a planning todo (`todowrite`)
- `serena_read_memory` read memories related to the prompt
- `serena_write_memory` anything that seems important
- `serena_delete_memory` to remove facts that are no longer accurate
- `serena_find_*` to understand the relation ship between files and symbols in a project
- `context7` → fetch related documentation
- `github grep` → explore package implementations
- `web search` → find guides and references
- `git log` + Opencode session history → review recent events
- `serena_think_about_collected_information` when you think you have enough information (are all of your planning todo's completed?)

### Finalize the plan
Once you have finished collecting information, create a new serena memory
- `todowrite` considering the initial prompt, and collected information
- `serena_write_memory` with a summary of your findings
- `serena_delete_memory` to remove previous outdated/duplicate/unnecessary research summaries

## Execution

Once you have a plan, begin execution.
Periodically check:
- `serena_think_about_task_adherance`
- `todoread`
- `serena_list_memories`
- `serena_read_memory`
- `serena_read_write`
- `serena_replace_*`
- `serena_insert_*`
- `thinnk_about_whether_you_are_done` (have you completed all your todos? )


