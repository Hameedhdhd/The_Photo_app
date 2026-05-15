# The Photo App — Product Roadmap

> **Last Updated:** May 2026  
> **Current Version:** V1 (MVP)  
> **Status:** Core features complete, ready for testing & iteration

---

## Vision

A community-driven **AI Marketplace** where anyone can **scan items with their phone**, get **AI-optimized listings**, and sell to others in their neighborhood. 

**Photo → AI Analysis (Gemini) → High-Conversion Description (Deepseek) → Map Discovery → Real-time Chat → Sold.**

---

## V1 — MVP (Current ✅)

### Core Flow
| Feature | Status | Description |
|---------|--------|-------------|
| Photo Capture | ✅ Done | Camera + gallery picker, image cropping |
| Room Selection | ✅ Done | 7 room categories (Kitchen, Bathroom, Bedroom, etc.) |
| AI Analysis | ✅ Done | Gemini 2.5 Flash generates title, price, category, bilingual descriptions |
| Multi-Photo | ✅ Done | Add multiple photos per scan; "Same Item" or "Separate Items" modes |
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

## V2 — Social Marketplace & AI Engine (Next)

**Goal:** Transform into a community marketplace with native messaging and advanced AI.

| Feature | Priority | Effort | Description |
|---------|----------|--------|-------------|
| **Real-time Chat** | 🔴 High | High | In-app messaging service with photo-sharing |
| **Deepseek Integration** | 🔴 High | Medium | Generate descriptions via Deepseek using a specific formula |
| **Address Listings** | 🔴 High | Low | Requirement for sellers to put an address for pickup |
| **Interactive Map** | 🔴 High | High | View and discover items on a map based on location |
| Item Status Flow | 🟡 Medium | Low | Draft → Listed → Sold status tracking |
| Share Item Card | 🟢 Low | Low | Generate shareable image/card for an item |

### AI Selling Flow
1. **Gemini 2.5 Flash:** High-speed visual analysis to extract item details.
2. **Deepseek V3:** Refines details into a high-conversion description based on the user's formula.

---

## V3 — Smart Marketplace Features

**Goal:** Enhance the marketplace experience with automation and trust.

| Feature | Priority | Description |
|---------|----------|-------------|
| **Marketplace Sync** | 🟡 Medium | Cross-post to eBay Kleinanzeigen, Vinted, and eBay simultaneously |
| **User Ratings** | 🟡 Medium | Buyer and seller rating system for trust |
| **Payment Integration** | 🔴 High | Secure in-app payments for services and products |
| **Smart Pricing** | 🟢 Low | AI suggests optimal price based on local market data |
| Notifications | 🔴 High | Push notifications for new messages and nearby deals |
| Dark Mode | 🟢 Low | System-aware dark theme |

---

## Known Issues & Limitations (V1)

| Issue | Severity | Description |
|-------|----------|-------------|
| No offline support | Medium | App requires internet for AI analysis and DB |
| Single primary image | Low | Only first photo is sent to AI; multi-angle not used |
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