# The Photo App — Development Workflow

> **Quick Start Guide** — How to run, develop, and deploy the app  
> **Last Updated:** May 2026

---

## Project Architecture

```
┌──────────────────────┐     ┌──────────────────────┐     ┌─────────────────────┐
│  React Native (Expo)  │────▶│  FastAPI Backend      │────▶│  Google Gemini      │
│  Frontend (SDK 54)    │     │  (Python 3.12)        │     │  2.5 Flash          │
│                       │     │                       │     └─────────────────────┘
│  - Camera / Picker    │     │  /api/analyze-image   │
│  - Inventory UI       │     │  /api/items           │     ┌─────────────────────┐
│  - Auth (Supabase)    │     │  /api/items/{id}      │────▶│  Supabase           │
│  - 5 Screens          │     │  /api/items/{id}/mark │     │  - PostgreSQL DB    │
│                       │     │    -listed             │     │  - Auth             │
└──────────────────────┘     │  - Image upload       │     │  - Storage          │
                             │  - AI analysis        │     └─────────────────────┘
┌──────────────────────┐     │  - Auth middleware     │
│  Chrome Extension     │────▶│                       │
│  (Manifest V3)        │     └──────────────────────┘
│                       │
│  - Kleinanzeigen Sync │     ┌──────────────────────┐
│  - Form Auto-Fill     │────▶│  eBay Kleinanzeigen   │
│  - Item Picker        │     │  (kleinanzeigen.de)   │
│  - Image Upload       │     └──────────────────────┘
└──────────────────────┘
```

---

## Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.12+ with venv
- **Expo Go** app on your phone (for testing)
- **Supabase** account with project configured
- **Google Gemini** API key (optional — mock mode works without it)
- **Google Chrome** browser (for extension development & Kleinanzeigen sync)

---

## Quick Start (4 Steps)

### 1. Start the Backend
```powershell
cd backend
.\venv\Scripts\activate
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
✅ Verify: Open http://localhost:8000 — should see `{"message":"Welcome to The Photo App API"}`

### 2. Start the Tunnel (for phone testing)
```powershell
npx localtunnel --port 8000
```
Copy the generated URL, then update `frontend/.env`:
```
EXPO_PUBLIC_API_URL=https://<your-tunnel-url>.loca.lt/api/analyze-image
```

> **Local testing only?** Skip the tunnel — use `http://localhost:8000/api/analyze-image` (web only).

### 3. Start the Frontend
```powershell
cd frontend
npm start
```
Scan the QR code with Expo Go on your phone, or press `w` for web.

### 4. Load the Chrome Extension (for Kleinanzeigen sync)
1. Open Chrome → `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right)
3. Click **Load unpacked** → select the `chrome-extension/` folder
4. Pin the extension in the toolbar

✅ Verify: Click the extension icon — should see the login popup

---

## Environment Setup

### First-Time Setup

1. **Clone & install:**
```powershell
git clone https://github.com/Hameedhdhd/The_Photo_app.git
cd The_Photo_app

# Backend
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt

# Frontend
cd ..\frontend
npm install
```

2. **Configure `.env` files:**

**`backend/.env`** (create if missing):
```
SUPABASE_URL=https://awwahpecfvdljgupnzft.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<from Supabase Dashboard — API Settings>
GEMINI_API_KEY=<from Google AI Studio — optional, mock mode without it>
```

**`frontend/.env`** (create if missing):
```
EXPO_PUBLIC_SUPABASE_URL=https://awwahpecfvdljgupnzft.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<from Supabase Dashboard — API Settings>
EXPO_PUBLIC_API_URL=http://localhost:8000/api/analyze-image
```

**`chrome-extension/config.js`** (pre-configured — update if backend URL changes):
```javascript
const API_URL = 'http://192.168.178.61:8000';  // Your backend URL
const SUPABASE_URL = 'https://awwahpecfvdljgupnzft.supabase.co';
const SUPABASE_ANON_KEY = '<from Supabase Dashboard — API Settings>';
```

**Root `.env`** (already exists — contains Supabase access token for Management API):
```
SUPABASE_ACCESS_TOKEN=sbp_...
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.awwahpecfvdljgupnzft.supabase.co:5432/postgres
```

3. **Run database migrations** (if setting up fresh):
```powershell
# Run the main migration in Supabase Dashboard → SQL Editor
# File: supabase/migration.sql

# For Kleinanzeigen sync features, also run:
# File: supabase/migration_kleinanzeigen_sync.sql
```

4. **Set up Supabase Storage bucket:**
```powershell
cd backend
.\venv\Scripts\activate
python setup_storage.py
```

5. **Verify Supabase connection:**
```powershell
cd backend
.\venv\Scripts\activate
python -c "from app.database import supabase; print('Connected!' if supabase else 'Failed')"
```

---

## Backend API Reference

| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/` | GET | Health check — returns welcome message | None |
| `/api/analyze-image` | POST | Upload photo → AI analysis → save item | Optional |
| `/api/items` | GET | List items for authenticated user (supports `status`, `limit`, `offset`) | Required |
| `/api/items/{item_id}` | GET | Get single item by ID | Required |
| `/api/items/{item_id}/mark-listed` | PATCH | Mark item as listed on marketplace | Required |

### Analyze Image Request
```
POST /api/analyze-image
Content-Type: multipart/form-data

Parameters:
  - file: JPEG/PNG image (required)
  - room: Kitchen|Bathroom|Bedroom|Living Room|Garage|Office|Other (optional)
  - mode: single|multi (default: single)
```

### Mark Listed Request
```
PATCH /api/items/{item_id}/mark-listed
Content-Type: application/json

Body: {
  "listing_status": "listed",     // listed|delisted|active
  "listing_url": "https://...",   // optional URL of the listing
  "marketplace": "kleinanzeigen"  // optional marketplace name
}
```

---

## Chrome Extension Workflow

### How It Works
1. **Login** — Click extension icon → sign in with Supabase Auth
2. **Select Item** — Choose an item from your inventory in the popup
3. **Navigate** — Go to `kleinanzeigen.de/p-anzeige-aufgeben.html` (create listing page)
4. **Auto-Fill** — Content script fills the form with item data (title, price, German description, images)

### Extension Files
| File | Purpose |
|------|---------|
| `manifest.json` | Manifest V3 config — permissions, content scripts, background |
| `config.js` | API URLs and Supabase credentials |
| `background.js` | Service worker — auth token management, message handling |
| `popup.html` / `popup.css` | Extension popup UI |
| `popup.js` | Popup logic — login, item selection, status display |
| `content.js` | Kleinanzeigen form auto-fill logic |

### Developing the Extension
1. Edit files in `chrome-extension/`
2. Go to `chrome://extensions/` → click the **refresh** icon on the extension card
3. Test by navigating to Kleinanzeigen's listing page

> **Note:** Content script only activates on `kleinanzeigen.de/p-anzeige-aufgeben.html*`

---

## Database Management

### View Current Schema
Run in **Supabase Dashboard → SQL Editor**:
```sql
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'items' 
ORDER BY ordinal_position;
```

### Add a New Column
Use the Management API script:
```python
import requests
token = 'sbp_...'  # From root .env
resp = requests.post(
    'https://api.supabase.com/v1/projects/awwahpecfvdljgupnzft/database/query',
    headers={'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'},
    json={'query': 'ALTER TABLE items ADD COLUMN new_col TYPE;'}
)
print(resp.status_code, resp.text)
```

Or use the migration helper:
```powershell
cd backend
.\venv\Scripts\activate
python migrate_db.py
```

⚠️ **Important:** After altering `public.items`, recreate the API view:
```sql
CREATE OR REPLACE VIEW api.items AS SELECT * FROM public.items;
```

### Migrations
| File | Purpose |
|------|---------|
| `supabase/migration.sql` | Full database schema, policies, API view — **reset everything** |
| `supabase/migration_kleinanzeigen_sync.sql` | Adds Kleinanzeigen sync columns (`listing_status`, `listed_at`, `listing_url`, etc.) |

### Reset Database (Nuclear Option)
Run `supabase/migration.sql` in the Supabase Dashboard SQL Editor. This drops and recreates everything.

---

## Development Workflow

### Daily Development
1. Start backend → start frontend → code → test on device
2. Backend auto-reloads on file changes (`--reload` flag)
3. Frontend auto-refreshes in Expo Go
4. Reload Chrome extension after changes (via `chrome://extensions/`)

### Adding a Feature
1. **Database change?** → Run migration SQL → Update `api.items` view → Update `supabase/migration.sql`
2. **New screen?** → Create in `src/screens/` → Add to `src/navigation/AppNavigator.js`
3. **New component?** → Create in `src/components/` → Follow existing patterns
4. **AI prompt change?** → Edit `backend/app/vision.py` → Restart backend
5. **New API endpoint?** → Add to `backend/app/main.py` → Update this workflow doc
6. **Chrome extension change?** → Edit in `chrome-extension/` → Reload in `chrome://extensions/`

### Testing the AI Flow
- **Without GEMINI_API_KEY:** Backend returns mock data — good for UI testing
- **With GEMINI_API_KEY:** Real AI analysis — test with actual photos
- **Test image:** Use any JPEG from your gallery

### Testing the Kleinanzeigen Flow
1. Ensure backend is running and Chrome extension is loaded
2. Sign in via extension popup
3. Select an item from your inventory
4. Navigate to `kleinanzeigen.de/p-anzeige-aufgeben.html`
5. Content script should auto-fill the form

### Running Backend Tests
```powershell
cd backend
.\venv\Scripts\activate
pytest tests/
```
Tests include:
- Health check (`GET /`)
- Missing file validation (`POST /api/analyze-image` without file → 422)
- Mock AI analysis (`POST /api/analyze-image` with dummy image)

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `SUPABASE_URL not set` | Check `.env` file exists and is in the right directory |
| `404 Could not find table 'api.items'` | Run `CREATE OR REPLACE VIEW api.items AS SELECT * FROM public.items;` in SQL Editor |
| `permission denied for schema api` | Run `GRANT ALL ON SCHEMA api TO service_role; GRANT ALL ON api.items TO service_role;` |
| `Network request failed` | Check tunnel URL in `frontend/.env`; restart tunnel if expired |
| `Camera not working` | Test on physical device; simulator doesn't have camera |
| `Mock data instead of AI` | Set `GEMINI_API_KEY` in `backend/.env` |
| `Port 8000 in use` | Kill process: `taskkill /PID <pid> /F` or use `--port 8001` |
| Chrome extension not loading | Check `chrome://extensions/` for errors; ensure `config.js` has correct URLs |
| Extension can't reach backend | Update `API_URL` in `config.js` to match your current backend address |
| Kleinanzeigen form not filling | Ensure you're on `kleinanzeigen.de/p-anzeige-aufgeben.html*`; check console for errors |
| `listing_status column not found` | Run `migration_kleinanzeigen_sync.sql` in Supabase SQL Editor |

---

## Deployment (Future)

### Backend → Cloud
1. **Railway** (recommended): Connect GitHub repo, set env vars, auto-deploy
2. **Fly.io**: `fly launch` → set secrets → deploy
3. **Update** `frontend/.env` and `chrome-extension/config.js` with production API URL

### Frontend → App Stores
1. **EAS Build:** `eas build --platform android` / `--platform ios`
2. **EAS Submit:** `eas submit --platform android` / `--platform ios`
3. See [Expo docs](https://docs.expo.dev/build/introduction/) for setup

### Chrome Extension → Web Store
1. Zip the `chrome-extension/` folder
2. Go to [Chrome Developer Dashboard](https://chrome.google.com/webstore/devconsole/)
3. Upload zip → fill listing details → submit for review
4. Update `config.js` with production API URL before packaging

---

## MCP Integration

The project uses a **Supabase MCP server** for AI-assisted database operations. Configured in `.mcp.json`:
```json
{
  "mcpServers": {
    "supabase": {
      "url": "https://mcp.supabase.com/mcp"
    }
  }
}
```
This allows AI coding agents to interact with Supabase directly (run queries, manage migrations, etc.).

---

## Key Files Reference

### Documentation
| File | Purpose |
|------|---------|
| `CONTEXT.md` | AI agent context — paste into any AI for full project understanding |
| `ROADMAP.md` | Product roadmap with V1/V2/V3 features |
| `PROJECT_PLAN.md` | Architecture decisions & technology stack rationale |
| `WORKFLOW.md` | This file — development workflow & setup guide |

### Backend
| File | Purpose |
|------|---------|
| `backend/app/main.py` | FastAPI routes — all API endpoints |
| `backend/app/vision.py` | Gemini AI integration & prompt engineering |
| `backend/app/auth.py` | Supabase Auth verification middleware |
| `backend/app/database.py` | Supabase client & DB connection |
| `backend/migrate_db.py` | Database migration helper script |
| `backend/setup_storage.py` | Supabase Storage bucket setup |
| `backend/tests/test_main.py` | Pytest backend tests (3 tests) |

### Frontend
| File | Purpose |
|------|---------|
| `frontend/App.js` | Root component — providers & navigator |
| `frontend/supabase.js` | Supabase client singleton (auth config) |
| `frontend/src/navigation/AppNavigator.js` | All screens and navigation stack |
| `frontend/src/screens/HomeScreen.js` | Main screen — camera/picker + room selection |
| `frontend/src/screens/ResultScreen.js` | AI analysis results — edit before saving |
| `frontend/src/screens/MyListingsScreen.js` | Inventory list with search & filters |
| `frontend/src/screens/ItemDetailScreen.js` | Single item detail view |
| `frontend/src/screens/LoginScreen.js` | Supabase Auth login/register |
| `frontend/src/theme/index.js` | Design tokens (colors, spacing) |
| `frontend/src/components/` | 14 reusable UI components |

### Chrome Extension
| File | Purpose |
|------|---------|
| `chrome-extension/manifest.json` | Manifest V3 — permissions, scripts, popup |
| `chrome-extension/config.js` | API URLs & Supabase credentials |
| `chrome-extension/background.js` | Service worker — auth & message handling |
| `chrome-extension/popup.html` / `popup.css` | Extension popup UI |
| `chrome-extension/popup.js` | Popup logic — login, item picker, status |
| `chrome-extension/content.js` | Kleinanzeigen form auto-fill engine |

### Database
| File | Purpose |
|------|---------|
| `supabase/migration.sql` | Full database schema + policies + API view |
| `supabase/migration_kleinanzeigen_sync.sql` | Kleinanzeigen sync columns migration |