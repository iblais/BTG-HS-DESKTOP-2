# Safe Autonomous Agent Guidelines

## FORBIDDEN - DO NOT DO THESE ACTIONS

### CRITICAL - PROTECTED FILES:
- **NEVER** edit `src/components/LessonScreen.tsx` (contains lesson articles)
- **NEVER** edit `src/data/articles.ts` (contains article content)
- **NEVER** edit `src/data/quizzes.ts` (contains quiz content)
- **NEVER** delete files without explicit user approval
- If a task requires changing protected files, **STOP** and ask the user first

### General Restrictions:
- Do not modify authentication or security-related code without explicit approval
- Do not delete or truncate data files
- Do not change database schemas without approval
- Do not modify environment variables or secrets
- Do not push directly to main/master without approval

## ALLOWED - SAFE ACTIONS

- Read any file to understand the codebase
- Create new files (that don't override protected files)
- Edit non-protected source files
- Run tests and builds
- Git operations: status, diff, log, branch, checkout (non-destructive)
- Install dependencies via npm/yarn

## PROCESS FOR PROTECTED FILES

If you need to modify a protected file:
1. **STOP** immediately
2. Explain to the user what change is needed and why
3. Wait for explicit approval before proceeding
4. Document any approved changes

## REFERENCE

Protected files are listed in: `.claude/protected-files.txt`
