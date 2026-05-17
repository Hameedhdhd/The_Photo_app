# 🌐 Start Web Testing — Quick Guide

## ⚡ Quick Start (30 seconds)

### Option 1: Automated (Windows)
```bash
cd C:\AI Projects\The_Photo_app
start_web_dev.bat
```
This opens 2 new windows (backend + frontend) automatically.

---

## 🔧 Manual Start (Recommended for Control)

### Step 1: Start Backend (Terminal 1)
```bash
cd C:\AI Projects\The_Photo_app\backend

# Activate virtual environment
.venv\Scripts\activate

# Start server
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Expected output**:
```
INFO:     Started server process [1234]
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete
```

✅ **Backend ready at**: `http://localhost:8000`

---

### Step 2: Start Frontend Web (Terminal 2)
```bash
cd C:\AI Projects\The_Photo_app\frontend

# Install dependencies (first time only)
npm install

# Start Expo web
expo start --web
```

**Expected output**:
```
Expo DevTools is running at http://localhost:19000
Local:   http://localhost:19006
Press w to open web, a for Android, i for iOS
```

✅ **Frontend ready at**: `http://localhost:19006`

Browser should open automatically. If not, manually visit: **http://localhost:19006**

---

## 🧪 Testing the App

### 1. Login
- Tap **"Quick Login"** button
- No password needed in dev mode

### 2. Take a Photo
- Tap **"Take Photo"** (or simulator camera)
- Select **"Kitchen"** room
- Tap **"Analyze"**

### 3. View Results
- AI generates title, price, description
- Edit if needed
- Tap **"Save to Inventory"**

### 4. Browse Marketplace
- Tap **"Marketplace"** tab
- See saved items
- Try search & filters
- View on map

---

## ⚠️ Troubleshooting

### Backend won't start
```bash
# Make sure you're in backend folder
cd backend

# Activate virtual environment
.venv\Scripts\activate

# Check Python version
python --version  # Should be 3.10+

# Install dependencies
pip install -r requirements.txt

# Try again
python -m uvicorn app.main:app --reload
```

### Frontend won't start
```bash
cd frontend

# Clear cache and reinstall
rm -r node_modules package-lock.json
npm install

# Clear Expo cache
expo start --clear

# Restart
expo start --web
```

### API returns 404
- Make sure backend is running on Terminal 1
- Check `.env` file has `EXPO_PUBLIC_API_URL=http://localhost:8000`
- Verify API is accessible: `http://localhost:8000/`

### Blank screen in browser
```bash
# In Terminal 2, press 'w' to open web
# Or manually go to: http://localhost:19006

# If still blank:
expo start --clear
```

### Port already in use
```bash
# Backend (8000) in use?
python -m uvicorn app.main:app --port 8001

# Frontend (19006) in use?
expo start --web --clear
```

---

## 🎯 What to Test

### ✅ Core Features
- [x] Login works
- [x] Camera integration
- [x] Photo analysis (AI)
- [x] Listing creation
- [x] Inventory grid
- [x] Search & filters
- [x] Map view

### ✅ Performance
- [x] Images load fast
- [x] Scroll is smooth
- [x] No lag on clicks
- [x] API calls are quick

### ✅ Error Handling
- [x] Try invalid inputs
- [x] Go offline (DevTools)
- [x] Disconnect backend
- [x] Check error messages

### ✅ UI/UX
- [x] Buttons responsive
- [x] Layout looks good
- [x] Text readable
- [x] No console errors

---

## 📊 Developer Tools

### Chrome DevTools (Frontend)
- Press `F12` to open
- **Console**: Check for errors
- **Network**: Monitor API calls
- **Performance**: Check FPS

### Terminal Output (Backend)
- Watch for API logs
- Check response times
- Look for errors

---

## 🛑 Stop the App

### Method 1: Close Windows
- Close both terminal windows
- Web browser closes automatically

### Method 2: Keyboard Shortcuts
- **Terminal 1**: `Ctrl+C` (stop backend)
- **Terminal 2**: `Ctrl+C` (stop frontend)

---

## 📞 Issues?

1. **Check backend logs** — Terminal 1
2. **Check frontend logs** — Terminal 2
3. **Check browser console** — F12
4. **See SETUP_COMPLETE.md** for more help

---

## ✨ Tips

- **Hot Reload**: Save a file → frontend auto-reloads
- **No Rebuild**: Changes appear instantly
- **API Logs**: Terminal 1 shows all API calls
- **Error Details**: Browser console shows full errors

---

**Now visit: http://localhost:19006** 🎉

Let me know if you hit any issues!
