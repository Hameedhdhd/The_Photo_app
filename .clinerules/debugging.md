# Debugging Guide

> Consult this before diagnosing bugs to know where to look first.

## Common Issues & Where to Look

### Supabase / Database
| Symptom | Check First |
|---------|------------|
| Data not loading | RLS policies — user may not have SELECT permission |
| Insert/update silently failing | RLS policies — user may not own the row |
| Realtime not firing | Table must have Realtime enabled in Supabase dashboard |
| `relation "APP_Table" does not exist` | Old table name — change to `items` |
| Auth session null | `supabase.auth.getSession()` — session may have expired |

### React Native / Frontend
| Symptom | Check First |
|---------|------------|
| Screen crash on navigation | Check `route.params` — params may be undefined |
| Map not rendering | `react-native-maps` installed? Google Maps key in `app.json`? |
| Image picker not working | `expo-image-picker` permissions granted? |
| Chat not updating in real-time | Supabase Realtime subscription — check `ChatDetailScreen.js` |
| "Cannot read property of undefined" | Check optional chaining: `item?.field` |

### Backend / FastAPI
| Symptom | Check First |
|---------|------------|
| AI description empty | Deepseek API key valid? Falls back to Gemini — check logs |
| Geocoding returning null | `GOOGLE_MAPS_API_KEY` set in backend `.env`? |
| 500 on upload | Supabase Storage bucket exists? Correct bucket name? |
| CORS errors | `main.py` CORS origins — add frontend URL |

## Debugging Steps
1. Check the **error message exactly** — don't guess
2. Search the codebase for the error string before editing anything
3. Check memory bank (`progress.md` Known Issues) — it may already be documented
4. For Supabase issues: check RLS policies first, then table schema
5. For frontend crashes: add `console.log` at the crash point, check params/state
6. For API issues: test the endpoint directly with curl or Postman before editing code

## Key Log Points
- Frontend: `console.log('[ScreenName]', variable)` pattern
- Backend: FastAPI auto-logs to terminal — check for Python tracebacks
- Supabase: Use Supabase dashboard → Logs → API logs for query-level debugging

## Before Asking for Help
- Document what you tried in `memory-bank/current-task.md`
- Include exact error message
- Include which file/line the error occurs
