# Project Overview

The Photo App is a community-driven **AI Marketplace** (React Native/Expo) that enables users to buy and sell products or services with ease. It leverages advanced AI for automated listing creation and provides a rich social commerce experience through integrated messaging and map-based discovery.

## Architecture
- **Frontend**: React Native with Expo (Cross-platform iOS/Android).
- **Backend**: FastAPI (Python) for AI orchestration and business logic.
- **Database**: Supabase (PostgreSQL) for real-time data, Auth, and RLS.
- **AI Stack**: 
  - **Google Gemini**: Visual analysis of products/services.
  - **Deepseek**: High-conversion description generation based on specialized formulas.
- **Maps**: Integrated map view for location-based item discovery.
- **Messaging**: Real-time in-app chat for buyer-seller communication.
- **Storage**: Supabase Storage for high-quality item and chat images.

## Key Features
- **AI-Powered Selling**: Take a photo → Gemini analyzes it → Deepseek writes the perfect description.
- **Community Marketplace**: List products or services for others to browse and buy.
- **Real-time Chat**: In-app messaging with photo-sharing to negotiate and agree on deals.
- **Geographic Discovery**: Interactive map to find items and services near your location.
- **Address-Based Listings**: Every listing includes a physical location for easy pickup/meeting.
- **Inventory Management**: Track your own listings, favorites, and sold items.

## Technical Stack
- Supabase for Auth, DB, and Storage.
- Postgrest for data access.
- React Navigation for app flow.
- Reanimated for smooth UI transitions.
