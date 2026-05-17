# Plan Mode Workflow

## When to Use PLAN MODE

Use PLAN MODE when the user requests:
- A detailed implementation plan
- Step-by-step instructions for a feature
- Architecture decisions that need discussion
- Complex changes requiring user approval before implementation

## PLAN MODE Rules

### 1. Always Use `ZZAI Plan.md` for Detailed Plans

When in PLAN MODE and creating a detailed implementation plan:

**DO:**
- Write all detailed plans to: `C:\AI Projects\The_Photo_app\ZZAI Plan.md`
- Use structured, machine-readable format (see format below)
- Include exact file paths (absolute paths)
- Provide precise SEARCH/REPLACE blocks
- Add verification commands
- Include error handling steps

**DON'T:**
- Create plans in chat responses only
- Use relative language ("around line X", "near the top")
- Skip file paths or be vague about locations
- Write plans for humans - optimize for AI execution

### 2. ZZAI Plan.md Format (AI-Optimized)

The plan must be structured for AI parsing and execution:

```markdown
## TASK: [Task Name]
**Status:** [PENDING/IN_PROGRESS/COMPLETE]
**Priority:** [HIGH/MEDIUM/LOW]

### EXECUTION_ORDER: [1-N]

---

### FILE: [Absolute file path]
**ACTION:** [CREATE/MODIFY/DELETE]
**DEPENDENCIES:** [List of files that must be modified first, or "NONE"]

#### SEARCH (if MODIFY):
```[language]
[Exact text to find - must match character-for-character]
```

#### REPLACE:
```[language]
[Exact replacement text]
```

#### VERIFICATION:
- [ ] [Command to verify change worked]
- [ ] [Expected output or behavior]

---
```

### 3. Example AI-Optimized Plan Structure

```markdown
## TASK: Add Manual Entry Button
**Status:** PENDING
**Priority:** HIGH

### EXECUTION_ORDER: 1

---

### FILE: c:\AI Projects\The_Photo_app\frontend\src\screens\HomeScreen.js
**ACTION:** MODIFY
**DEPENDENCIES:** NONE

#### SEARCH:
```javascript
  }, [imageUris, analyzeSingleImage, getSessionUserId]);

  const handleLogout = useCallback(async () => {
```

#### REPLACE:
```javascript
  }, [imageUris, analyzeSingleImage, getSessionUserId]);

  const handleAddManually = useCallback(() => {
    console.log('[HomeScreen] Navigating to manual result with photos:', imageUris.length);
    navigation.navigate('Result', {
      result: { 
        title: '', 
        description: '', 
        price: '', 
        item_id: null,
        category: 'Other'
      },
      imageUris: [...imageUris],
      room: selectedRoom,
      isManual: true,
    });
  }, [navigation, imageUris, selectedRoom]);

  const handleLogout = useCallback(async () => {
```

#### VERIFICATION:
- [ ] Run: `cd frontend && npm start`
- [ ] Check console: Should see new handler function in HomeScreen
- [ ] No TypeScript/ESLint errors
- [ ] Function is called when button is pressed

---
```

### 4. When to Update ZZAI Plan.md

**Create New Plan When:**
- User requests a new feature
- User asks "how to implement X"
- Complex multi-file changes are needed
- User says "write a detailed plan"

**Update Existing Plan When:**
- Task status changes (PENDING → IN_PROGRESS → COMPLETE)
- User provides feedback or modifications
- Dependencies change
- Errors are encountered during execution

### 5. Transitioning from PLAN to ACT MODE

When user switches from PLAN MODE to ACT MODE:

1. **Read `ZZAI Plan.md`** - Parse the entire plan
2. **Follow EXECUTION_ORDER** - Execute tasks in numerical order
3. **Check DEPENDENCIES** - Ensure dependent files are modified first
4. **Use Exact SEARCH/REPLACE blocks** - Copy them character-for-character
5. **Run VERIFICATION commands** - Confirm each change worked
6. **Update Status in Plan** - Mark tasks as IN_PROGRESS then COMPLETE
7. **If Errors Occur** - Document them in the plan and stop execution

### 6. Plan File Location

- **Absolute Path:** `C:\AI Projects\The_Photo_app\ZZAI Plan.md`
- **Always use this exact file** - Do not create alternate plan files
- **Update in place** - Don't create new versions or backups

### 7. Communicating with User in PLAN MODE

When in PLAN MODE:
- Use `plan_mode_respond` to discuss with user
- Write detailed plans to `ZZAI Plan.md`
- Ask clarifying questions before writing the plan
- Show user the structure before asking them to switch to ACT MODE

### 8. Best Practices

**For AI Agents:**
- Be extremely precise with file paths (always absolute)
- Use exact text matching in SEARCH blocks
- Include full context (5-10 lines) in SEARCH blocks
- Test SEARCH blocks mentally before writing
- Add console.log statements for debugging
- Include rollback instructions if changes fail

**For Plan Quality:**
- Each task should be independently executable
- Include all imports/dependencies
- Specify exact line ranges when helpful
- Add error handling steps
- Include testing commands
- Document expected behavior

### 9. Plan Maintenance

After execution:
- Mark completed tasks with `**Status:** COMPLETE`
- Add "Completed: [date]" timestamp
- Keep failed tasks marked with `**Status:** FAILED` and reason
- Archive old plans to `ZZAI Plan - Archive.md` when starting fresh

---

**Remember:** The goal is to write plans that ANY AI agent can execute perfectly without human interpretation.
