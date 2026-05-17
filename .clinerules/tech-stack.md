# Tech Stack Reference

> Read this when writing code or debugging to use the correct libraries/patterns.

## Frontend — React Native (Expo)
- **Language**: JavaScript (not TypeScript)
- **Framework**: React Native with Expo SDK
- **Navigation**: React Navigation (stack + bottom tabs) — see `frontend/src/navigation/AppNavigator.js`
- **State**: Local component state (`useState`) — no global state library
- **Styling**: StyleSheet.create() — no external CSS libraries
- **Maps**: `react-native-maps` with OpenStreetMap (default provider — no API key needed)
- **Image Picker**: `expo-image-picker`
- **Animations**: `react-native-reanimated`
- **Supabase Client**: `frontend/supabase.js` — import from here, never re-initialize

## Backend — FastAPI (Python)
- **Framework**: FastAPI
- **Language**: Python 3.x
- **Entry point**: `backend/app/main.py`
- **AI Orchestration**: `backend/app/description_engine.py`
- **Package Manager**: pip

## Database — Supabase (PostgreSQL)
- **Auth**: Supabase Auth (email/password)
- **ORM**: Direct Supabase client (Postgrest) — no SQLAlchemy
- **Real-time**: Supabase Realtime (Postgres Changes) for chat
- **Storage**: Supabase Storage (`items` bucket, `chat_images` bucket)
- **RLS**: Enabled on all tables — always write policies for new tables

## Key Tables
| Table | Purpose |
|-------|---------|
| `items` | All marketplace listings (has `address`, `latitude`, `longitude`) |
| `messages` | Chat messages (keyed by `chat_id`) |
| `profiles` | User profile data |

## AI Services
| Service | Role | Fallback |
|---------|------|---------|
| Google Gemini 2.5 Flash | Photo/product visual analysis | None |
| Deepseek | High-conversion description writing | Gemini description |

## External APIs
- **Nominatim (OpenStreetMap)**: Backend — convert address → lat/lng (free, no API key)
- **react-native-maps (OSM default)**: Frontend — map rendering, no API key needed

## Key File Locations
```
frontend/
  App.js                     → Root app
  supabase.js                → Supabase client (single source)
  src/
    screens/                 → All screen components
    navigation/AppNavigator.js → Navigation config
    components/              → Reusable components

backend/
  app/
    main.py                  → FastAPI entry point
    description_engine.py    → AI description logic

supabase/
  marketplace_migration.sql  → Latest DB schema migration
  migration.sql              → V1 migration

memory-bank/                 → Persistent project context
.clinerules/                 → AI behavior rules
```
