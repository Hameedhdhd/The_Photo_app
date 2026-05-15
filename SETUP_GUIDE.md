# 🚀 Premium AI Marketplace — Setup Guide

This guide walks you through setting up the Premium AI Marketplace with all new features: **Deepseek descriptions**, **Real-time Chat**, **Address Listings**, and **Map Discovery**.

---

## Prerequisites

- Node.js 18+
- Python 3.12+
- Expo CLI
- Supabase account
- Google Gemini API key
- Deepseek API key
- Google Maps API key

---

## 1. Database Migration

Run the marketplace migration in your **Supabase SQL Editor**:

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `supabase/marketplace_migration.sql`
4. Click **Run**

This will:
- Add `address`, `latitude`, `longitude` columns to `items` table
- Create `messages` table for real-time chat
- Enable Supabase Realtime for messages
- Set up RLS policies for both anon and authenticated users
- Create `api.messages` view for REST access

---

## 2. Backend Setup

### Install Python dependencies

```bash
cd backend
pip install httpx  # Required for Deepseek API calls
```

### Environment Variables

Add these to your `backend/.env` file:

```bash
GEMINI_API_KEY=your_gemini_api_key
DEEPSEEK_API_KEY=your_deepseek_api_key
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### Start the Backend

```bash
cd backend
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

---

## 3. Frontend Setup

### Install new dependencies

```bash
cd frontend
npm install react-native-maps expo-image-picker
```

### Configure Google Maps (for Map view)

Add to `frontend/app.json`:

```json
{
  "expo": {
    "ios": {
      "config": {
        "googleMapsApiKey": "YOUR_GOOGLE_MAPS_API_KEY"
      }
    },
    "android": {
      "config": {
        "googleMaps": {
          "apiKey": "YOUR_GOOGLE_MAPS_API_KEY"
        }
      }
    }
  }
}
```

### Start the Frontend

```bash
cd frontend
npx expo start
```

---

## 4. Supabase Storage Setup

### Create `chat_images` bucket

1. Go to **Supabase Dashboard → Storage**
2. Click **New Bucket**
3. Name: `chat_images`
4. Enable **Public bucket**
5. Click **Create bucket**

### Set storage policies

Run in SQL Editor:

```sql
-- Allow anyone to view chat images
CREATE POLICY "Anyone can view chat images"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'chat_images');

-- Allow authenticated users to upload chat images
CREATE POLICY "Authenticated users can upload chat images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'chat_images');
```

---

## 5. API Keys

### Deepseek API Key
1. Sign up at [platform.deepseek.com](https://platform.deepseek.com)
2. Go to **API Keys**
3. Create a new key
4. Copy to `backend/.env` as `DEEPSEEK_API_KEY`

### Google Maps API Key
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Enable **Maps SDK for iOS**, **Maps SDK for Android**, and **Geocoding API**
3. Create credentials → API Key
4. Copy to both `backend/.env` and `frontend/app.json`

### Gemini API Key (already configured)
1. Get from [Google AI Studio](https://aistudio.google.com/apikey)
2. Copy to `backend/.env` as `GEMINI_API_KEY`

---

## 6. Verify Installation

### Backend Health Check
```bash
curl http://localhost:8000/
# Should return: {"message":"Welcome to The Photo App API"}
```

### Test Deepseek Integration
```bash
curl -X POST http://localhost:8000/api/analyze-image \
  -F "file=@test_photo.jpg" \
  -F "address=Berlin, Germany"
```

The response should include:
- `description`: Deepseek-generated high-conversion description
- `address`: The address you provided
- `latitude` / `longitude`: Geocoded coordinates

---

## Feature Overview

| Feature | Status | How to Test |
|---------|--------|-------------|
| AI-Powered Selling | ✅ | Take a photo → Gemini analyzes → Deepseek writes description |
| Marketplace | ✅ | Browse items on Marketplace tab |
| Real-time Chat | ✅ | Tap "Message" on any item to start chatting |
| Address Listings | ✅ | Address is required when listing an item |
| Map Discovery | ✅ | Switch to Map view on Marketplace tab |
| Photo Sharing in Chat | ✅ | Tap image icon in chat to send photos |

---

## Troubleshooting

### Map doesn't show
- Ensure `react-native-maps` is installed
- Verify Google Maps API key is configured in `app.json`
- Check that items have `latitude` and `longitude` values

### Chat not working
- Verify Supabase Realtime is enabled for the `messages` table
- Check that you're logged in (auth required for messaging)
- Ensure `chat_images` bucket exists in Supabase Storage

### Deepseek descriptions not generating
- Verify `DEEPSEEK_API_KEY` is set in `backend/.env`
- Check backend logs for API errors
- Fallback: Gemini descriptions will be used if Deepseek is unavailable

### Geocoding not working
- Verify `GOOGLE_MAPS_API_KEY` is set in `backend/.env`
- Ensure Geocoding API is enabled in Google Cloud Console
- Items will still save without coordinates (map won't show them)