# Project Rules

## General Rules
- Always read memory bank before starting any task
- **CRITICAL: NEVER read or open `.env` files**
- Minimize token usage — only read files relevant to the task
- Never scan the entire repository unless explicitly required
- Prefer editing existing files instead of creating duplicates
- Avoid unnecessary tool calls
- Keep responses concise — no long explanations
- Summarize completed work briefly

## Code Quality Rules
- Never break existing working features when adding new ones
- Always handle errors gracefully — no unhandled promise rejections or crashes
- Use `async/await` (not `.then()` chains) for async code in JS
- Use descriptive variable names — no single-letter vars except loop counters
- Remove unused imports and dead code when touching a file

## Project-Specific Rules
- **DB table**: Always use `items` table (not `APP_Table` — that's the old name)
- **Chat IDs**: Format is `{sorted_uid1}_{sorted_uid2}_{item_id}` — never change this convention
- **Auth**: Always use Supabase Auth — never roll custom auth
- **Storage**: Use Supabase Storage buckets (`items`, `chat_images`)
- **RLS**: Every new Supabase table must have Row Level Security enabled
- **AI Flow**: Gemini (vision) → Deepseek (copywriting) → fallback to Gemini description if Deepseek fails
- **Navigation**: 4-tab bottom nav (Marketplace, Scan, My Items, Messages) — check `AppNavigator.js` before adding screens

## Security Rules
- Never log sensitive data (tokens, keys, user PII) to console
- Never hardcode API keys — always use env variables
- Always validate user ownership before allowing edits/deletes

## When Context Becomes Large
- Summarize progress
- Update memory bank
- Recommend `/smol` or `/newtask`
