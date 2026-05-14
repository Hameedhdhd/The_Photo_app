# Project Overview

## Goal
A mobile and web ecosystem for listing items on Kleinanzeigen, featuring AI-powered image analysis to generate professional, bilingual listings.

## Technologies
- **Frontend**: React Native (Expo) - Mobile app for capturing photos and managing items.
- **Backend**: FastAPI (Python) - Handles image analysis (Gemini/DeepSeek), Supabase integration, and description formatting.
- **Database/Auth**: Supabase - Postgres DB, Auth, and Storage for item images.
- **Chrome Extension**: Manifest V3 extension for syncing items from the app to the Kleinanzeigen listing form.

## Chrome Extension Architecture
- **Popup**: Main UI for browsing app items and local drafts. Handles image fetching via background worker.
- **Background Worker**: Acts as a proxy for CORS-restricted image fetching and orchestrates batch listing.
- **Content Script**: Injected into Kleinanzeigen listing pages. Bridges the popup and the main world (inject script).
- **Inject Script**: Runs in the page's main world to access React internals. Uses multiple strategies to bypass React's file upload protections and programmatically fill form fields.

## Key Features
- **AI Listing Generation**: Analyzes photos to detect brand, model, and generate bilingual (DE/EN) descriptions.
- **Multi-Image Support**: Syncs multiple photos per item from the app to the listing form.
- **Batch Processing**: Sequentially lists multiple items on Kleinanzeigen (saved as drafts).
- **Local Drafts**: Allows capturing current Kleinanzeigen form state into a local draft for later use.
