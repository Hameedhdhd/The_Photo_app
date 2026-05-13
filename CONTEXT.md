# The Photo App — AI Agent Context Document

> **Purpose:** Paste this document into any AI coding agent to give it complete project understanding.  
> **Last Updated:** May 2026

---

## Project Overview

The Photo App is a **personal inventory & marketplace listing tool**. Users photograph items, AI generates titles/descriptions/prices, and items are saved to a Supabase database. The app supports bilingual listings (German/English) and is designed for eventual integration with eBay Kleinanzeigen. It runs as a React Native (Expo) frontend with a FastAPI Python backend and Google Gemini 2.5 Flash for AI vision analysis.

---

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  React Native    │────▶│  FastAPI Backend  │────▶│  Google Gemini  │
│  (Expo SDK 54)   │     │  (Python 3.12)    │     │  2.5 Flash      │
│                  │     │                   │     └─────────────────┘
│  - Camera/Pick   │     │  /api/analyze-img │
│  - Inventory UI  │     │  - Receives photo │     ┌─────────────────┐
│  - Auth (Supa)   │     │  - Calls Gemini   │────▶│  Supabase       │
│                  │     │  - Uploads image  │     │  - PostgreSQL DB │
│                  │◀────│  - Returns result  │     │  - Auth          │
│                  │     │  - Saves to DB     │     │  - Storage       │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

**Data Flow:** Photo → FastAPI → Gemini analysis → Save to Supabase → Return to frontend → Display in inventory

---

## File Structure

```
The_Photo_app/
├── .env                          # Root env (SUPABASE_URL, keys, ACCESS_TOKEN)
├── .gitignore                    # Protects .env, venv, __pycache__
├── CONTEXT.md                    # THIS FILE — AI agent context
├── ROADMAP.md                    # Product roadmap (V1/V2/V3)
├── WORKFLOW.md                   # How to run the project
├── PROJECT_PLAN.md               # Original project plan (archived)
│
├── backend/
│   ├── .env                      # Backend env (SUPABASE_URL, SERVICE_ROLE_KEY, GEMINI_API_KEY)
│   ├── .gitignore
│   ├── fix_api_access.py         # Script: Creates api.items view for REST API access
│   ├── migrate_db.py             # Script: Run database migrations
│   ├── run_migration.py          # Script: Execute SQL migrations
│   ├── setup_storage.py          # Script: Create Supabase storage bucket
│   ├── venv/                     # Python virtual environment
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py               # FastAPI app — single endpoint: POST /api/analyze-image
│   │   ├── vision.py             # Gemini AI vision engine (analyze_image)
│   │   ├── database.py           # Supabase client initialization
│   │   └── temp_uploads/         # Temp storage for uploaded images (cleaned after processing)
│   └── tests/
│
├── frontend/
│   ├── .env                      # EXPO_PUBLIC_SUPABASE_URL, ANON_KEY, API_URL
│   ├── .gitignore
│   ├── App.js                    # Expo entry point — loads AppNavigator
│   ├── app.json                  # Expo config
│   ├── babel.config.js
│   ├── index.js                  # Root renderer
│   ├── package.json              # Dependencies: expo, supabase, navigation, image-picker
│   ├── supabase.js               # Supabase client (uses EXPO_PUBLIC_ vars + AsyncStorage)
│   ├── assets/                   # App icons, splash images
│   └── src/
│       ├── components/
│       │   ├── Button.js          # Reusable button with variants (primary, secondary, outline)
│       │   ├── Card.js            # Generic card wrapper
│       │   ├── CategoryScroll.js  # Horizontal scrollable category pills
│       │   ├── Chip.js            # Filter chip component
│       │   ├── DebugButton.js     # Dev-only debug trigger
│       │   ├── EmptyState.js      # Empty inventory placeholder
│       │   ├── Header.js          # Screen header with back button
│       │   ├── ImageCropper.js    # Photo crop before analysis
│       │   ├── LanguageToggle.js  # DE/EN switch for descriptions
│       │   ├── ListingCard.js     # Inventory grid item — shows image, title, price, ❤️ favorite
│       │   ├── LoadingSpinner.js  # Loading indicator
│       │   ├── MenuDrawer.js      # Side menu navigation
│       │   ├── ResultCard.js      # AI result display card
│       │   └── SearchBar.js       # Search input with filter icon
│       ├── navigation/
│       │   └── AppNavigator.js    # Stack navigator — all screens defined here
│       ├── screens/
│       │   ├── HomeScreen.js      # Main screen — camera/gallery, room selector, multi-photo
│       │   ├── LoginScreen.js     # Simplified login (Supabase auth + mock mode)
│       │   ├── ResultScreen.js    # AI results — editable fields, language toggle, copy button
│       │   ├── MyListingsScreen.js # Inventory grid — search, filter, favorites
│       │   └── ItemDetailScreen.js # Single item view — edit, favorite, copy description
│       ├── theme/
│       │   └── index.js           # Colors, spacing, typography constants
│       └── utils/
│           └── DebugLogger.js     # Dev logging utility
│
└── supabase/
    └── migration.sql              # Full DB schema — table, RLS policies, API view, storage
```

---

## Database Schema

### Table: `public.items`

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `item_id` | TEXT (PK) | `'draft'` | Primary key, format: `ITEM-XXXXXXXX` |
| `title` | VARCHAR | `'draft'` | Item title from AI |
| `room` | TEXT | `'draft'` | Room category (Kitchen, Bathroom, etc.) |
| `price` | VARCHAR | `'draft'` | Price string (e.g., "45 EUR") |
| `category` | VARCHAR | `'draft'` | Item category from AI |
| `status` | TEXT | `'draft'` | Item status (draft/listed/sold) |
| `description_en` | TEXT | `'draft'` | English description |
| `description_de` | TEXT | `'draft'` | German description |
| `user_id` | UUID | null | Links to auth.users (null = anonymous) |
| `image_url` | TEXT | null | Supabase storage public URL |
| `created_at` | TIMESTAMPTZ | `now()` | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | `now()` | Last update timestamp |
| `favorite` | BOOLEAN | `false` | User favorite flag |

### View: `api.items`
- Mirrors `public.items` for REST API access
- Uses `security_invoker=on` so RLS policies on `public.items` are respected
- The Supabase project only exposes the `api` schema
- All CRUD operations go through this view
- **⚠️ If you alter `public.items`, recreate the view:** `CREATE OR REPLACE VIEW api.items WITH (security_invoker=on) AS SELECT * FROM public.items;`

### Storage Bucket: `item_images`
- Public access for reading
- Images stored as `{item_id}.jpg`

### RLS Policies
- **Anon role:** Full CRUD (development phase, no auth required)
- **Authenticated role:** Can only CRUD own items (user_id = auth.uid())

---

## API Endpoints

### `POST /api/analyze-image`

**Request:** `multipart/form-data`
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | File | ✅ | Image file (JPEG/PNG) |
| `room` | string | ❌ | Room category |
| `user_id` | string | ❌ | User UUID |

**Response:** `ListingResponse` JSON
```json
{
  "title": "Vintage Table Lamp",
  "description_en": "A beautiful vintage table lamp...",
  "description_de": "Eine schöne Vintage-Tischlampe...",
  "price": "45 EUR",
  "category": "Home & Garden",
  "room": "Living Room",
  "item_id": "ITEM-A1B2C3D4",
  "image_url": "https://...supabase.co/storage/...",
  "user_id": null
}
```

**Side Effects:**
1. Image uploaded to Supabase Storage (`item_images` bucket)
2. Item inserted into `items` table
3. Temp file cleaned up

**Without GEMINI_API_KEY:** Returns mock data for testing.

### `GET /`
Health check endpoint.

---

## Frontend Navigation Flow

```
LoginScreen
    ↓ (login/mock-login)
HomeScreen (camera + room selector + multi-photo)
    ↓ (photo taken/selected + room chosen)
ResultScreen (AI results — edit, toggle language, copy)
    ↓ (saved to DB)
MyListingsScreen (inventory grid — search, filter, favorites)
    ↓ (tap item)
ItemDetailScreen (view/edit single item)
```

**Navigation params:**
- `ResultScreen` receives: `results` (AI analysis data), `imageUri` (local photo)
- `MyListingsScreen` receives: nothing (fetches from Supabase)
- `ItemDetailScreen` receives: `item` (full item object from DB)

---

## State Management

- **No global state library** — uses React Navigation params and component-level state
- **Supabase client** is a singleton from `frontend/supabase.js`
- **Data fetching:** Direct Supabase queries in `useEffect` hooks
- **Auth state:** Managed by Supabase Auth + AsyncStorage

### Key Supabase Queries Used

```javascript
// Fetch items (inventory)
supabase.from('items').select('*').order('created_at', { ascending: false })

// Filter by category
supabase.from('items').select('*').eq('category', category)

// Filter favorites
supabase.from('items').select('*').eq('favorite', true)

// Search by title
supabase.from('items').select('*').ilike('title', `%${search}%`)

// Toggle favorite
supabase.from('items').update({ favorite: !item.favorite }).eq('item_id', item.item_id)

// Update item
supabase.from('items').update({ title, price, description_en, description_de }).eq('item_id', item_id)

// Delete item
supabase.from('items').delete().eq('item_id', item_id)
```

---

## Environment Variables

### Root `.env`
```
SUPABASE_URL=https://awwahpecfvdljgupnzft.supabase.co
SUPABASE_ANON_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...
SUPABASE_ACCESS_TOKEN=sbp_...
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.awwahpecfvdljgupnzft.supabase.co:5432/postgres
API_URL=http://192.168.178.61:8000/api/analyze-image
```

### `backend/.env`
```
SUPABASE_URL=https://awwahpecfvdljgupnzft.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...
GEMINI_API_KEY=... (set for real AI, omit for mock mode)
```

### `frontend/.env`
```
EXPO_PUBLIC_SUPABASE_URL=https://awwahpecfvdljgupnzft.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
EXPO_PUBLIC_API_URL=http://192.168.178.61:8000/api/analyze-image
```

---

## Development Conventions

### Frontend (React Native / Expo)
- **Language:** JavaScript (not TypeScript)
- **Styling:** StyleSheet.create() — theme constants in `src/theme/index.js`
- **Components:** Functional components with hooks
- **Navigation:** React Navigation v6 (Stack Navigator)
- **Naming:** PascalCase for components, camelCase for functions
- **Images:** Use `item.image_url` with fallback placeholder

### Backend (FastAPI / Python)
- **Language:** Python 3.12
- **Style:** PEP 8, type hints on models
- **Structure:** Single module (`app/`) — `main.py` (routes), `vision.py` (AI), `database.py` (DB client)
- **Env:** python-dotenv, never commit secrets

### Database
- **Primary key:** `item_id` (TEXT, not auto-increment)
- **Schema quirk:** REST API only sees `api` schema → use `api.items` view
- **Migrations:** Run SQL via Supabase Management API or Dashboard SQL Editor

---

## Common Tasks (Quick Reference)

### Add a new database column
1. Run via Supabase Management API:
```python
requests.post(
    f'https://api.supabase.com/v1/projects/{project}/database/query',
    headers={'Authorization': f'Bearer {ACCESS_TOKEN}'},
    json={'query': 'ALTER TABLE items ADD COLUMN new_col TYPE;'}
)
```
2. Update `api.items` view: `CREATE OR REPLACE VIEW api.items AS SELECT * FROM public.items;`
3. Update frontend queries to include the new column
4. Update `supabase/migration.sql` with the change

### Add a new screen
1. Create `frontend/src/screens/NewScreen.js`
2. Add to `frontend/src/navigation/AppNavigator.js`
3. Add navigation call from parent screen

### Change AI prompt
1. Edit `backend/app/vision.py` — modify the prompt in `analyze_image()`
2. Restart backend: `uvicorn app.main:app --reload`

### Run backend locally
```powershell
cd backend
.\venv\Scripts\activate
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Run frontend locally
```powershell
cd frontend
npm start
```

---

## Recent Changes (May 2026)

1. **Favorites feature** — Added `favorite` column (BOOLEAN DEFAULT false) to items table
2. **Copy description** — One-tap clipboard copy on ResultScreen and ItemDetailScreen
3. **API schema fix** — Created `api.items` view because REST API only exposes `api` schema, not `public`
4. **Root .env** — Centralized env file with SUPABASE_ACCESS_TOKEN for Management API
5. **Item detail navigation** — Can navigate from inventory to detail view and back
6. **Favorites filter** — Filter inventory to show only favorite items

---

## Known Issues

1. **API schema:** REST API uses `api.items` view with `security_invoker=on`, not `public.items` directly. If you alter the `public.items` table, you MUST recreate the view: `CREATE OR REPLACE VIEW api.items WITH (security_invoker=on) AS SELECT * FROM public.items;`
2. **Mock login:** No real auth enforcement — anyone can access all items
3. **Backend is local:** Needs cloud deployment (Railway, Fly.io) for production
4. **Multi-photo:** Only first photo sent to AI; additional photos stored but not analyzed
5. **item_id default:** Column default is `'draft'` — the real ID is generated in FastAPI