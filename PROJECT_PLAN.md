# The Photo App - AI Marketplace Project Plan

## Overview
The goal of this project is to create a community-driven **AI Marketplace** where users can post products or services, discover items via an interactive map, and communicate in real-time to close deals. The app leverages a dual-AI approach (Gemini + Deepseek) to automate the listing process, making it effortless to sell used items or offer services.

The primary constraint is a **low budget**, necessitating a stack that maximizes free tiers (Supabase, Gemini Free Tier) while providing a premium user experience.

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
1. **Quick Access:** User clicks "Login" to enter the app.
2. **Post Listing:** User takes a photo of a product or describes a service.
3. **AI Generation:** 
   * **Gemini** analyzes the photo to identify the item.
   * **Deepseek** writes a compelling description using a specific high-conversion formula.
4. **Location & Address:** User enters an address (or uses GPS) for the listing.
5. **Marketplace Discovery:** Users explore listings via a list or an **Interactive Map**.
6. **Communication:** Interested buyers text the seller directly via **In-app Chat**.
7. **Deal Closure:** Buyers and sellers agree on a price and meeting point/pickup address.

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

### Phase 4: Marketplace & Messaging
* **Goal:** Transform the app into a social marketplace.
* **Tasks:**
  1. **Messaging Service:** Implement real-time chat between users with photo-sharing support.
  2. **Address Support:** Add mandatory address fields to the listing creation flow.
  3. **AI Description Formula:** Integrate Deepseek API to process Gemini's output into a final listing description.

### Phase 5: Maps & Discovery
* **Goal:** Enable geographic discovery of items.
* **Tasks:**
  1. **Map Integration:** Add a Map view to the frontend (React Native Maps).
  2. **Geocoding:** Convert addresses to lat/long coordinates for map markers.
  3. **Discovery UI:** Allow users to toggle between grid view and map view.

## Estimated Budget
* **Frontend Hosting:** $0 (Vercel / Netlify)
* **Database/Auth:** $0 (Supabase Free Tier)
* **API Hosting:** ~$0 - $5 / month
* **AI API Usage:** Pay per use.
