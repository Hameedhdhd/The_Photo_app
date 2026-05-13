# ⚡ Kleinanzeigen Sync - Chrome Extension

A Chrome Extension that bridges **The Photo App** to [Kleinanzeigen](https://www.kleinanzeigen.de), allowing you to automatically fill listing forms with items from your inventory database.

## Features

- 🔐 **Secure Login** - Authenticate with your Photo App account (Supabase Auth)
- 📋 **Item Picker** - Browse and select items from your inventory
- ⚡ **One-Click Fill** - Auto-populate Kleinanzeigen listing form (title, description, price, images)
- 🇩🇪 **German by Default** - Uses `description_de` for German marketplace
- 📸 **Image Upload** - Automatically uploads item images via DataTransfer API
- ✅ **Status Tracking** - Mark items as "Listed on Kleinanzeigen" in your database

## Installation

### 1. Configure the Extension

Edit `config.js` and update these values:

```javascript
const CONFIG = {
  API_URL: 'http://localhost:8000',           // Your FastAPI backend URL
  SUPABASE_URL: 'https://xxxxx.supabase.co',  // Your Supabase project URL
  SUPABASE_ANON_KEY: 'eyJhbGciOi...',          // Your Supabase anon key
};
```

You can find the Supabase values in your [Supabase Dashboard](https://supabase.com/dashboard) → Settings → API.

### 2. Generate Icons

Open `icons/generate-icons.html` in a browser, right-click each canvas, and save as:
- `icons/icon16.png`
- `icons/icon48.png`
- `icons/icon128.png`

### 3. Load the Extension in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right)
3. Click **Load unpacked**
4. Select the `chrome-extension/` folder
5. The extension icon should appear in your toolbar

### 4. Run the Database Migration

Execute `supabase/migration_kleinanzeigen_sync.sql` in your Supabase SQL Editor to add the `listing_status`, `listed_at`, and `listing_url` columns.

### 5. Install Backend Dependencies

```bash
cd backend
pip install PyJWT
```

Set the `SUPABASE_JWT_SECRET` environment variable in your backend `.env` file (found in Supabase Dashboard → Settings → API → JWT Secret).

## Usage

1. **Log In** - Click the extension icon and sign in with your Photo App credentials
2. **Select an Item** - Browse your items and click one to view details
3. **Navigate to Kleinanzeigen** - Go to [kleinanzeigen.de/p-anzeige-aufgeben.html](https://www.kleinanzeigen.de/p-anzeige-aufgeben.html)
4. **Fill the Form** - Either:
   - Click the **⚡ Fill from My App** floating button on the Kleinanzeigen page, OR
   - Click **⚡ Fill Kleinanzeigen Form** in the extension popup
5. **Review & Publish** - Check the category selection, then click Publish on Kleinanzeigen
6. **Mark as Listed** - Click **✅ Mark as Listed on Kleinanzeigen** to update your database

## Architecture

```
┌──────────────────┐     ┌──────────────────┐     ┌─────────────┐
│  Chrome Extension │────▶│  FastAPI Backend  │────▶│   Supabase   │
│  (content.js +    │     │  /api/items       │     │   Database   │
│   popup.js)       │◀────│  /api/items/{id}  │◀────│   + Storage  │
└──────────────────┘     └──────────────────┘     └─────────────┘
        │                        │
        │   JWT auth token       │ Verifies JWT
        │   from Supabase        │ via PyJWT
        ▼                        ▼
  ┌──────────────┐        ┌──────────────┐
│  popup.html    │        │  auth.py      │
│  (Login UI)    │        │  (JWT verify) │
└──────────────┘        └──────────────┘
```

## File Structure

```
chrome-extension/
├── manifest.json      # Extension manifest (MV3)
├── config.js          # API URL + Supabase config (EDIT THIS)
├── popup.html         # Login + item picker UI
├── popup.css          # Popup styling
├── popup.js           # Auth + item management logic
├── content.js         # Kleinanzeigen form filler
├── background.js      # Service worker for message routing
├── icons/
│   ├── generate-icons.html  # Icon generator tool
│   ├── icon16.png           # (generated)
│   ├── icon48.png           # (generated)
│   └── icon128.png          # (generated)
└── README.md
```

## API Endpoints

The extension uses these backend endpoints:

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/items` | JWT | List all items for the user |
| `GET` | `/api/items/{item_id}` | JWT | Get single item details |
| `PATCH` | `/api/items/{item_id}/mark-listed` | JWT | Mark item as listed |

## Troubleshooting

### "Not logged in" error
- Open the extension popup and log in again
- Sessions expire after 1 hour (Supabase default)

### Form fields not filling
- Kleinanzeigen may have updated their DOM. Check the browser console for `[Kleinanzeigen Sync]` logs
- The selectors in `content.js` may need updating. Look at the Kleinanzeigen page source and update the `SELECTORS` object

### Images not uploading
- Ensure your Supabase storage bucket (`item_images`) has public access
- Check the browser console for CORS errors
- The DataTransfer API requires the images to be downloadable (CORS-friendly)

### Extension not appearing on Kleinanzeigen
- Make sure you're on `https://www.kleinanzeigen.de/p-anzeige-aufgeben.html` (exact URL)
- Refresh the page after installing the extension
- Check `chrome://extensions/` for errors

## Security Notes

- The extension uses Supabase JWT tokens for authentication
- Tokens are stored in `chrome.storage.local` (encrypted on disk)
- The backend verifies JWT signatures using `SUPABASE_JWT_SECRET`
- Row Level Security (RLS) in Supabase ensures users can only access their own items
- In development mode (no `SUPABASE_JWT_SECRET` set), the backend decodes tokens without verification