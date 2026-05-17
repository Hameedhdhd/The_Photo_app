# The Photo App — Complete Setup Guide

**Last Updated**: 2026-05-16  
**Version**: 2.0.0 Premium  
**Status**: Production-Ready ✅

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Project Structure](#project-structure)
3. [Backend Setup](#backend-setup)
4. [Frontend Setup](#frontend-setup)
5. [Environment Configuration](#environment-configuration)
6. [Running the App](#running-the-app)
7. [Testing](#testing)
8. [Deployment](#deployment)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required
- **Node.js** ≥ 18.x
- **Python** ≥ 3.10
- **Expo CLI** (latest)
- **Git**

### Accounts Required
- **Supabase** (free tier OK)
- **Google Cloud Console** (Gemini API)
- **Anthropic** (optional, for Claude)

### Recommended
- **VS Code** with React Native extension
- **Android Studio** (for Android emulator)
- **Xcode** (for iOS, macOS only)

---

## Project Structure

```
The_Photo_app/
├── frontend/              # React Native + Expo
│   ├── src/
│   │   ├── screens/       # App screens
│   │   ├── components/    # Reusable components
│   │   ├── utils/         # Helpers & utilities
│   │   ├── hooks/         # Custom React hooks
│   │   ├── theme/         # Colors, styles
│   │   └── navigation/    # App navigation
│   ├── App.js             # Entry point
│   ├── app.json           # Expo configuration
│   └── package.json       # Dependencies
│
├── backend/               # FastAPI + Python
│   ├── app/
│   │   ├── main.py        # API routes
│   │   ├── database.py    # Supabase connection
│   │   ├── services/      # Business logic
│   │   ├── errors.py      # Error handling
│   │   └── __init__.py
│   ├── requirements.txt    # Python dependencies
│   ├── .env               # Configuration
│   └── supabase/          # Database setup
│
├── supabase/              # Database config
│   └── migrations/        # SQL migrations
│
├── docs/                  # Documentation
├── .env.example           # Template
├── ROADMAP.md             # Feature roadmap
└── README.md              # Project overview
```

---

## Backend Setup

### 1. Install Dependencies

```bash
cd backend
python -m venv .venv

# Activate virtual environment
# On macOS/Linux:
source .venv/bin/activate
# On Windows:
.venv\Scripts\activate

# Install packages
pip install -r requirements.txt
```

### 2. Configure Environment

Create `backend/.env`:

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# Google Gemini
GEMINI_API_KEY=your-gemini-api-key

# Deepseek (optional)
DEEPSEEK_API_KEY=your-deepseek-api-key

# Server
API_HOST=0.0.0.0
API_PORT=8000
DEBUG=true
```

### 3. Initialize Database

```bash
# Apply migrations
cd supabase
psql -U postgres < migrations/*.sql

# Or use Supabase dashboard at supabase.com
```

### 4. Start Backend

```bash
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

API available at: `http://localhost:8000`

---

## Frontend Setup

### 1. Install Dependencies

```bash
cd frontend
npm install

# or with yarn
yarn install
```

### 2. Configure Environment

Create `frontend/.env.local`:

```env
EXPO_PUBLIC_API_URL=http://localhost:8000
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_KEY=your-anon-key
```

### 3. Install Expo CLI

```bash
npm install -g expo-cli
# or
yarn global add expo-cli

# Verify
expo --version
```

### 4. Start Frontend

```bash
cd frontend

# Start Expo development server
expo start

# Then select:
# - "a" for Android emulator
# - "i" for iOS simulator
# - "w" for web
# - "r" to reload
```

---

## Environment Configuration

### Required Variables

#### Frontend (`.env.local`)
```env
EXPO_PUBLIC_API_URL=http://your-api-url
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_KEY=your-public-anon-key
```

#### Backend (`.env`)
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-service-role-key
GEMINI_API_KEY=your-gemini-api-key
API_HOST=0.0.0.0
API_PORT=8000
DEBUG=true
```

### Production Variables

For production (use secure secret management):

```env
# Backend
SUPABASE_KEY=**use-service-role-key**
GEMINI_API_KEY=**from-google-cloud**
DEBUG=false
ALLOWED_ORIGINS=https://yourdomain.com

# Frontend
EXPO_PUBLIC_API_URL=https://api.yourdomain.com
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
```

---

## Running the App

### Development Mode

**Terminal 1 - Backend**:
```bash
cd backend
source .venv/bin/activate  # or .venv\Scripts\activate on Windows
python -m uvicorn app.main:app --reload
```

**Terminal 2 - Frontend**:
```bash
cd frontend
expo start
```

Then open the Expo app on your phone and scan the QR code.

### Web Version

```bash
cd frontend
expo start --web

# Opens at http://localhost:19006
```

### Production Build

**Android APK**:
```bash
cd frontend
eas build --platform android
```

**iOS App**:
```bash
cd frontend
eas build --platform ios
```

(Requires EAS account and Apple Developer account)

---

## Testing

### Frontend Unit Tests

```bash
cd frontend

# Run all tests
npm test

# Run specific test
npm test -- validation.test.js

# Watch mode
npm test -- --watch
```

### Backend Unit Tests

```bash
cd backend

# Run all tests
python -m pytest

# Run specific test
python -m pytest tests/test_validation.py

# With coverage
python -m pytest --cov=app
```

### Integration Tests

```bash
cd frontend

# Simulate API responses
npm run test:integration
```

### Manual Testing

See `TESTING_GUIDE.md` for comprehensive testing procedures.

---

## Deployment

### Heroku (Backend)

```bash
cd backend

# Create Procfile
echo "web: uvicorn app.main:app --host 0.0.0.0 --port \$PORT" > Procfile

# Deploy
heroku create your-app-name
heroku config:set SUPABASE_URL=...
git push heroku main
```

### Vercel (Frontend)

```bash
cd frontend

# Deploy
vercel deploy
```

### Railway / Render (Backend)

Both support Python + FastAPI out of the box.

---

## Troubleshooting

### Backend Issues

**Problem**: `ModuleNotFoundError: No module named 'app'`
- **Solution**: Activate virtual environment and reinstall dependencies
  ```bash
  source .venv/bin/activate
  pip install -r requirements.txt
  ```

**Problem**: `SUPABASE_KEY not found`
- **Solution**: Check `.env` file exists in `backend/` directory with correct values

**Problem**: API returns 500 error
- **Solution**: Check backend logs, ensure all services (Supabase, Gemini) are configured

### Frontend Issues

**Problem**: Blank screen in Expo
- **Solution**: 
  ```bash
  expo start --clear
  npm install
  ```

**Problem**: Module not found errors
- **Solution**: 
  ```bash
  rm -rf node_modules
  npm install
  expo start --clear
  ```

**Problem**: API calls return 404
- **Solution**: Verify `EXPO_PUBLIC_API_URL` is correct and backend is running

### Database Issues

**Problem**: Can't connect to Supabase
- **Solution**: Check connection string, verify VPN is off, check Supabase dashboard for issues

**Problem**: Missing tables
- **Solution**: Run migrations: `psql < supabase/migrations/*.sql` or use Supabase dashboard

---

## Development Workflow

### 1. Create Feature Branch

```bash
git checkout -b feature/my-feature
```

### 2. Develop Locally

- Make changes
- Test thoroughly
- Run unit tests

### 3. Commit Changes

```bash
git add .
git commit -m "feat: Add my feature"
```

### 4. Push & Create PR

```bash
git push origin feature/my-feature
```

### 5. Merge After Review

```bash
git checkout main
git merge feature/my-feature
git push origin main
```

---

## Useful Commands

### Frontend
```bash
# Start development server
expo start

# Run on iOS
expo start --ios

# Run on Android
expo start --android

# Run on web
expo start --web

# Run tests
npm test

# Build APK
eas build --platform android
```

### Backend
```bash
# Start server
python -m uvicorn app.main:app --reload

# Run migrations
python -m alembic upgrade head

# Format code
black app/

# Lint
flake8 app/

# Run tests
pytest
```

---

## Next Steps

1. ✅ Complete initial setup
2. ✅ Configure environment variables
3. ✅ Run both frontend and backend locally
4. ✅ Test with real device/emulator
5. ✅ Run test suite
6. ✅ Deploy to staging
7. ✅ Final testing and QA
8. ✅ Deploy to production

---

## Support & Resources

- **Expo Documentation**: https://docs.expo.dev
- **FastAPI Documentation**: https://fastapi.tiangolo.com
- **Supabase Documentation**: https://supabase.com/docs
- **React Native Documentation**: https://reactnative.dev

---

## Version History

| Version | Date | Status |
|---------|------|--------|
| 2.0.0 | 2026-05-16 | Premium - Production Ready ✅ |
| 1.0.0 | 2026-04-01 | MVP |

---

*For questions, issues, or contributions, please contact the team.*
