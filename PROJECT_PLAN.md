# The Photo App - Project Plan & Architecture

## Overview
The goal of this project is to evolve the existing "Sell-Items" script into a cross-platform mobile and web application. This will allow users to take a picture of an item on their phone, have AI automatically generate the listing details (title, description, price, category), and eventually help them post it to platforms like eBay Kleinanzeigen. 

The primary constraint is a **low budget**, necessitating a stack that maximizes free tiers and serverless architecture while minimizing ongoing operational costs.

## Proposed Technology Stack (Low Budget & High Efficiency)

1. **Frontend (Web, iOS, Android): React Native with Expo**
   * **Why:** "Write once, run everywhere." We build the app once and it compiles to iOS, Android, and Web. Expo handles the complex build processes and allows immediate testing on physical devices via the Expo Go app. 
   * **Cost:** Free.

2. **Backend & Database: Supabase (Free Tier)**
   * **Why:** A "Backend-as-a-Service" (BaaS) that replaces the need for a dedicated, always-on server for database and auth.
   * **Features included:**
     * PostgreSQL database (for storing user data, generated listings, etc.).
     * Authentication (Email/Password, Google, Apple logins).
     * Cloud Storage (for temporarily or permanently storing uploaded item photos).
   * **Cost:** Generous free tier, practically zero cost until significant scale.

3. **API & AI Processing: Serverless API (FastAPI + Serverless Provider) + OpenAI**
   * **Why:** Running Python scripts continuously on a Virtual Private Server (VPS) costs money. Instead, we convert the core Python logic into an API and host it "serverless" (e.g., Vercel, Render, or a very cheap VPS).
   * **Cost:** Server hosting can be free or <$5/month. The AI API (OpenAI or Anthropic) operates on a pay-per-use model (pennies per photo).

## User Flow
1. **Capture/Upload:** User opens the app (mobile or web) and clicks "New Item". They take a photo or select one from their gallery.
2. **Storage:** The app uploads the image to Supabase Storage.
3. **AI Analysis:** The app calls our API. The API sends the image to the Vision AI model to extract details (Title, Description, Category, Price) based on our pre-defined prompts.
4. **Review & Edit:** The AI returns the data to the app. The user reviews the generated listing, edits text if necessary, and saves it.
5. **Publish/Share:** 
   * **V1 (Simplest/Cheapest):** User clicks "Copy Details". They open the native Kleinanzeigen app and paste the details.
   * **V2:** App generates deep links to pre-fill web forms where possible.
   * **V3:** App integrates with a backend worker for automated posting (complex and requires a cheap VPS for Playwright).

## Step-by-Step Working Plan

### Phase 1: API Migration (Current Python Code -> Web Service)
* **Goal:** Make the existing AI logic accessible over the internet.
* **Tasks:**
  1. Initialize a new Python project (FastAPI).
  2. Move `vision_engine.py` and `market_research.py` logic into API endpoints.
  3. Create an endpoint that accepts an image file upload and returns the JSON listing data.
  4. Test locally using Postman or cURL.
  5. Deploy to a cheap/free host (e.g., Render, Railway, or a cheap Hetzner VPS).

### Phase 2: Database and Authentication Setup
* **Goal:** Prepare the backend to store user accounts and their generated items.
* **Tasks:**
  1. Create a free Supabase project.
  2. Set up the `users` and `items` tables (defining schema: id, user_id, title, description, price, image_url, status).
  3. Set up Supabase Storage buckets for images.
  4. Enable basic Email/Password authentication.

### Phase 3: Cross-Platform Frontend Development
* **Goal:** Build the user-facing application.
* **Tasks:**
  1. Initialize a React Native / Expo project.
  2. Build UI Screens:
     * Authentication (Login / Register).
     * Home / Dashboard (List of "My Items").
     * Camera / Image Picker screen.
     * Item Details (Reviewing the AI output).
  3. Integrate Supabase Client for Auth and Database reads/writes.
  4. Connect the app to the Phase 1 API for image processing.

### Phase 4: Kleinanzeigen Integration Strategy (Iterative)
* **Goal:** Bridge the gap between the app and the final marketplace.
* **Tasks:**
  1. Implement "Copy to Clipboard" functionality in the app for immediate utility.
  2. Research URL schemes or deep linking for specific marketplaces.
  3. (Optional / Later) Build an isolated worker queue on a cheap VPS that uses Playwright to physically post items based on database flags.

## Estimated Budget
* **Frontend Hosting (Web):** $0 (Vercel / Netlify)
* **Database/Auth:** $0 (Supabase Free Tier)
* **API Hosting:** ~$0 - $5 / month (Render, Railway, DigitalOcean Droplet)
* **AI API Usage:** Pay per use. Variable based on user volume.
* **App Store Fees:**
  * Google Play: $25 (One-time fee)
  * Apple App Store: $99 / year (Can be deferred by launching as a Web App first).