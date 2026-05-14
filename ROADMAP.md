# The Photo App — Product Roadmap

> **Last Updated:** May 2026  
> **Current Version:** V1 (MVP)  
> **Status:** Core features complete, ready for testing & iteration

---

## Vision

A personal inventory app that lets you **scan items with your phone**, get **AI-generated listings instantly**, and manage everything in one place. Built for people who want to catalog their belongings and sell them on marketplaces like eBay Kleinanzeigen — fast and effortlessly.

**One photo → AI title, description, price, category → Saved to your inventory → Ready to sell.**

---

## V1 — MVP (Current ✅)

### Core Flow
| Feature | Status | Description |
|---------|--------|-------------|
| Photo Capture | ✅ Done | Camera + gallery picker, image cropping |
| Room Selection | ✅ Done | 7 room categories (Kitchen, Bathroom, Bedroom, etc.) |
| AI Analysis | ✅ Done | Gemini 2.5 Flash generates title, price, category, bilingual descriptions |
| Multi-Photo | ✅ Done | Add multiple photos per scan; syncs all photos to Kleinanzeigen via extension |
| Edit Results | ✅ Done | Edit title, price, description before saving |
| Language Toggle | ✅ Done | Switch between German (DE) and English (EN) descriptions |
| Copy Description | ✅ Done | One-tap copy to clipboard for marketplace listing |
| Item Inventory | ✅ Done | Grid view with search, category filter, favorites filter |
| Item Detail View | ✅ Done | View and edit any saved item, navigate from inventory |
| Favorites | ✅ Done | Heart icon to mark favorite items, filter by favorites |
| Save to DB | ✅ Done | Auto-saves to Supabase with image storage |
| Auth | ✅ Done | Supabase auth + mock login for development |

### Tech Stack (V1)
- **Frontend:** React Native + Expo SDK 54
- **Backend:** FastAPI (Python 3.12)
- **Database:** Supabase (PostgreSQL) with `api` schema view
- **AI Engine:** Google Gemini 2.5 Flash
- **Storage:** Supabase Storage (item_images bucket)

---

## V2 — Marketplace Integration (In Progress 🚧)

**Goal:** Go from "inventory app" to "selling tool" — list items on Kleinanzeigen directly.

| Feature | Status | Description |
|---------|--------|-------------|
| Kleinanzeigen Chrome Extension | ✅ Done | Chrome Extension (MV3) that auto-fills Kleinanzeigen listing form with item data |
| Backend Item API | ✅ Done | `GET /api/items`, `GET /api/items/{id}`, `PATCH /api/items/{id}/mark-listed` with JWT auth |
| Listing Status Tracking | ✅ Done | `listing_status` column (draft/listed_kleinanzeigen/listed_ebay/sold), `listed_at`, `listing_url` |
| JWT Auth Middleware | ✅ Done | `auth.py` verifies Supabase JWT tokens for Chrome Extension API access |
| Image Upload to Kleinanzeigen | ✅ Done | Robust 4-strategy upload system for bypassing React protections; multi-image support |
| Export to CSV | 🔲 Todo | Export inventory as spreadsheet |
| Share Item Card | 🔲 Todo | Generate shareable image/card for an item |
| Bulk Actions | 🔲 Todo | Select multiple items → delete, favorite, export |
| Price Suggestion | 🔲 Todo | AI suggests optimal price based on similar items |

### Kleinanzeigen Integration — Implemented Approach
✅ **Chrome Extension (Implemented):** Content script injected into `kleinanzeigen.de/p-anzeige-aufgeben.html` fills title, German description, price, and uploads images with one click. Uses Supabase Auth for secure access to user's items.

How it works:
1. User logs into Chrome Extension with same credentials as mobile app
2. Extension fetches user's items from FastAPI backend (JWT-secured)
3. User selects an item and navigates to Kleinanzeigen listing page
4. "⚡ Fill from My App" button auto-fills the form
5. User manually selects category and clicks Publish
6. Item can be marked as "listed" in the database

This approach avoids bot-bans (it's just form-filling, not automation) and requires no API agreement with Kleinanzeigen.

---

## V3 — Smart Inventory

**Goal:** Make the app indispensable with smart features and polish.

| Feature | Priority | Description |
|---------|----------|-------------|
| Barcode/QR Scanner | 🟡 Medium | Scan barcodes to auto-fill item details |
| Receipt Scanner | 🟡 Medium | Scan receipts to auto-add purchase price & date |
| Value Tracking | 🟢 Low | Track item value over time, depreciation |
| Multi-Marketplace | 🟡 Medium | List on eBay, Vinted, Kleinanzeigen simultaneously |
| Smart Categories | 🟢 Low | AI auto-suggests categories based on photo |
| Notifications | 🟢 Low | Reminders for unsold listings, price drops |
| Offline Mode | 🟢 Low | Queue scans when offline, sync when connected |
| Dark Mode | 🟢 Low | System-aware dark theme |

---

## Known Issues & Limitations (V1)

| Issue | Severity | Description |
|-------|----------|-------------|
| No offline support | Medium | App requires internet for AI analysis and DB |
| Single primary image | Low | Only first photo is sent to AI for analysis, but all photos are saved and listed |
| No real auth flow | Medium | Mock login bypasses real authentication |
| API on local network | High | Backend runs locally; needs cloud deployment for production |
| No error recovery | Medium | If AI analysis fails midway, no retry mechanism |
| View-based API access | Low | REST API uses `api.items` view, not direct table |

---

## Success Metrics

| Metric | Target (V2) | How to Measure |
|--------|-------------|----------------|
| Items scanned per session | 5+ | Analytics event |
| Time from photo to saved item | < 30 seconds | End-to-end timing |
| Listings created on Kleinanzeigen | 3+ per week | User self-report |
| Active users (weekly) | 10+ | Supabase auth logs |
| App crash rate | < 1% | Error tracking |

---

## Budget Estimate

| Service | Cost | Notes |
|---------|------|-------|
| Frontend (Expo) | $0 | Free tier |
| Database (Supabase) | $0 | Free tier (500MB DB, 1GB storage) |
| Backend Hosting | $0–5/mo | Railway/Fly.io free tier or cheap VPS |
| AI API (Gemini) | ~$0.01/item | Pay-per-use, very affordable |
| Domain | $10/yr | Optional for production |
| **Total** | **~$0–15/mo** | |