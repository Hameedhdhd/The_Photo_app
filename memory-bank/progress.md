# Progress

## 2025-05-13: Multi-Select Batch Listing Feature
- [x] Added `tabs` permission to manifest.json for tab management
- [x] Added multi-select checkboxes to popup UI (popup.html + popup.css)
- [x] Added "Select All" checkbox and "Batch List" button
- [x] Added batch progress bar with percentage fill
- [x] Implemented batch orchestration in background.js:
  - Opens Kleinanzeigen tab in background
  - Sends FILL_FORM with batchMode flag
  - Waits for human-like typing to complete
  - Sends SAVE_DRAFT message to click "Entwurf speichern"
  - Closes tab and moves to next item
  - Random delays between items (8-20s, anti-bot)
- [x] Implemented human-like typing in content.js (typeHumanLike):
  - Types one character at a time with 50-150ms random delay
  - Random delays between fields (800-2300ms in batch mode)
- [x] Implemented save-as-draft in content.js (saveDraft):
  - Searches for "Entwurf speichern" button by text content
  - Falls back to data-testid selectors
- [x] Content.js handles SAVE_DRAFT and batchMode messages

## 2026-05-13: Chrome Extension Bug Fixes (Round 2)
- Fixed "No items found" — items had different user_id than logged-in user; reassigned all 3 items to hameed@hd.com
- Fixed Kleinanzeigen listing page URL: changed from `p-anzeige-aufgeben.html` to `p-anzeige-aufgeben-schritt2.html`
- Updated manifest.json content_scripts to match both URL patterns
- Updated popup.html instructions link to correct page
- Improved empty state message to hint about account mismatch
- Fixed 401 Unauthorized (clock skew) — added `leeway=60` to all JWT decode calls in auth.py
- Updated content.js SELECTORS to match actual Kleinanzeigen schritt2 DOM (ad-title, ad-description, ad-price-amount, etc.)
- Made fillForm robust — continues filling even if one field fails (try/catch per field)
- Improved setNativeValue with focus/keyboard events for better React compatibility
- Added 🔍 Debug DOM button for DOM inspection

## 2026-05-13: Chrome Extension Bug Fixes (Round 1)
- Fixed critical `selectItem()` crash — `event` was implicit, now passed explicitly
- Added token refresh (`refreshSession`, `getValidSession`) to SupabaseAuth class
- Added API URL auto-detection with fallback (localhost → LAN IP)
- Fixed CORS image fetching — content script delegates to background service worker
- Background FETCH_IMAGE handler uses ArrayBuffer→base64 (FileReader unavailable in MV3)
- Updated manifest.json: added 127.0.0.1, Supabase storage CDN (*.supabase.in) permissions
- Removed leftover code in content.js after API URL fallback refactor

## 2026-05-14: Chrome Extension - Items Not Showing & Filling/Photo Fixes
- Fixed critical bug: `popup.html` was missing `<span id="user-email">` element, causing a crash on login.
- **Improved Photo Upload**: Added 4 strategies in `inject.js` to bypass React's file input protections.
- **Robust Filling**: Expanded selectors for title, description, and price; enhanced `setVal` with extra events for React detection.
- **Process Reordering**: Changed `fillForm` to fill text fields *first*, then upload photos, providing better UX.
- **Multi-Image Support**: Optimized image gathering in `popup.js` and `background.js` to fetch all unique URLs.
- **UX Update**: Prevented automatic tab closing in `background.js` after filling/batch listing.
- Updated all changes to GitHub.

## 2026-05-13: Local Dev Environment Setup
- Recreated broken Python venv (`backend/venv` was incomplete - missing pip, activate scripts)
- Installed all dependencies: fastapi, uvicorn, python-dotenv, PyJWT, requests, supabase, Pillow, google-genai, python-multipart
- Backend running on http://0.0.0.0:8000
- Frontend (Expo) running on http://localhost:8081
