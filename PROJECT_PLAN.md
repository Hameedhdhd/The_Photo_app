# The Photo App - Project Plan & Architecture

## Overview
The goal of this project is to evolve the existing "Sell-Items" script into a cross-platform mobile and web application. This app serves as a **personal inventory database**, allowing users to catalog their items, know exactly what they own, and have the ability to list them directly on marketplaces like **eBay Kleinanzeigen**.

The primary constraint is a **low budget**, necessitating a stack that maximizes free tiers and serverless architecture while minimizing ongoing operational costs.

## Proposed Technology Stack (Low Budget & High Efficiency)

1. **Frontend (Web, iOS, Android): React Native with Expo**
   * **Why:** "Write once, run everywhere." We build the app once and it compiles to iOS, Android, and Web.
   * **Cost:** Free.

2. **Backend & Database: Supabase (Free Tier)**
   * **Why:** "Backend-as-a-Service" (BaaS) for database, auth, and storage.
   * **Features:** PostgreSQL database, Authentication, Cloud Storage.
   * **Cost:** Free tier.

3. **API & AI Processing: FastAPI + Google Gemini 2.5 Flash**
   * **Why:** High-performance AI vision at a low cost.
   * **Cost:** Pay-per-use (very low).

## User Flow
1. **Quick Access:** User clicks "Login" to enter the app immediately (full auth activation later).
2. **Capture/Upload:** Take a photo or select one from gallery.
3. **AI Analysis:** Backend analyzes image via Gemini to generate Title, Description, Category, and Price.
4. **Inventory Save:** Items are saved to the user's personal database.
5. **Database Management:** Users browse their inventory with a search bar and category filters.
6. **Marketplace Listing:**
   * **V1:** Copy details to clipboard for manual pasting.
   * **V2:** Direct listing integration for eBay Kleinanzeigen.

## Step-by-Step Working Plan

### Phase 1: API & Backend Integration (Completed ✅)
* FastAPI backend integrated with Gemini.
* Supabase database connected for item storage.

### Phase 2: Core Mobile App (Completed ✅)
* Expo project setup with navigation.
* Image picker and AI analysis flow implemented.

### Phase 3: Inventory Management & UI Polish (Current 🚀)
* **Simplified Login:** Quick entry button for frictionless start.
* **Database View:** 4-item grid layout to see more items at once.
* **Search & Filter:** Search bar on top with category/section filtering.
* **Smooth Scrolling:** Optimized list performance for large inventories.

### Phase 4: Kleinanzeigen Integration
* **Goal:** Direct listing from the app to Kleinanzeigen.
* **Tasks:**
  1. Implement "List on Kleinanzeigen" button.
  2. Research and implement automation (Deep-linking or headless browser workers).

## Estimated Budget
* **Frontend Hosting:** $0 (Vercel / Netlify)
* **Database/Auth:** $0 (Supabase Free Tier)
* **API Hosting:** ~$0 - $5 / month
* **AI API Usage:** Pay per use.
