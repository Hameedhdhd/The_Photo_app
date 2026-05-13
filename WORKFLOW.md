# The Photo App — Development Workflow

> **Quick Start Guide** — How to run, develop, and deploy the app  
> **Last Updated:** May 2026

---

## Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.12+ with venv
- **Expo Go** app on your phone (for testing)
- **Supabase** account with project configured
- **Google Gemini** API key (optional — mock mode works without it)

---

## Quick Start (3 Steps)

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

**Root `.env`** (already exists — contains Supabase access token for Management API):
```
SUPABASE_ACCESS_TOKEN=sbp_...
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.awwahpecfvdljgupnzft.supabase.co:5432/postgres
```

3. **Verify Supabase connection:**
```powershell
cd backend
.\venv\Scripts\activate
python -c "from app.database import supabase; print('Connected!' if supabase else 'Failed')"
```

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

⚠️ **Important:** After altering `public.items`, recreate the API view:
```sql
CREATE OR REPLACE VIEW api.items AS SELECT * FROM public.items;
```

### Reset Database (Nuclear Option)
Run `supabase/migration.sql` in the Supabase Dashboard SQL Editor. This drops and recreates everything.

---

## Development Workflow

### Daily Development
1. Start backend → start frontend → code → test on device
2. Backend auto-reloads on file changes (`--reload` flag)
3. Frontend auto-refreshes in Expo Go

### Adding a Feature
1. **Database change?** → Run migration SQL → Update `api.items` view → Update `supabase/migration.sql`
2. **New screen?** → Create in `src/screens/` → Add to `src/navigation/AppNavigator.js`
3. **New component?** → Create in `src/components/` → Follow existing patterns
4. **AI prompt change?** → Edit `backend/app/vision.py` → Restart backend

### Testing the AI Flow
- **Without GEMINI_API_KEY:** Backend returns mock data — good for UI testing
- **With GEMINI_API_KEY:** Real AI analysis — test with actual photos
- **Test image:** Use any JPEG from your gallery

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

---

## Deployment (Future)

### Backend → Cloud
1. **Railway** (recommended): Connect GitHub repo, set env vars, auto-deploy
2. **Fly.io**: `fly launch` → set secrets → deploy
3. **Update** `frontend/.env` with production API URL

### Frontend → App Stores
1. **EAS Build:** `eas build --platform android` / `--platform ios`
2. **EAS Submit:** `eas submit --platform android` / `--platform ios`
3. See [Expo docs](https://docs.expo.dev/build/introduction/) for setup

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `CONTEXT.md` | AI agent context — paste into any AI for full project understanding |
| `ROADMAP.md` | Product roadmap with V1/V2/V3 features |
| `supabase/migration.sql` | Full database schema + policies + API view |
| `backend/app/main.py` | FastAPI routes (single endpoint) |
| `backend/app/vision.py` | Gemini AI integration |
| `frontend/supabase.js` | Supabase client singleton |
| `frontend/src/navigation/AppNavigator.js` | All screens and navigation |
| `frontend/src/theme/index.js` | Design tokens (colors, spacing) |