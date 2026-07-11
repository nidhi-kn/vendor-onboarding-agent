# 🚀 START HERE - Complete Setup Guide

## ⚠️ CRITICAL: Port Configuration Fixed

**Problem:** Backend was on port 3000, frontend expected port 5000  
**Solution:** Backend now runs on port 5000

---

## Quick Start (2 Terminals)

### Terminal 1: Start Backend

```bash
cd backend
npm start
```

**Expected output:**
```
Server started on port 5000
```

✅ Backend URL: `http://localhost:5000`

---

### Terminal 2: Start Frontend

```bash
cd frontend
npm run dev
```

**Expected output:**
```
▲ Next.js 16.2.10
- Local:        http://localhost:3000
✓ Ready in 2.1s
```

✅ Frontend URL: `http://localhost:3000`

---

## Open Browser

Navigate to: **`http://localhost:3000`**

You should see the dashboard with vendor metrics.

---

## Troubleshooting

### Error: "Failed to load vendors"

**Check 1: Is backend running?**
```bash
curl http://localhost:5000/health
```

Should return:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "...",
    "service": "vendor-onboarding-agent"
  }
}
```

**If connection refused:**
- Backend is NOT running
- Start it: `cd backend && npm start`

**Check 2: Is backend on correct port?**
```bash
# Check backend .env file
cat backend/.env | findstr PORT
```

Should show: `PORT=5000`

**Check 3: Is frontend using correct URL?**
```bash
# Check frontend .env.local file
cat frontend/.env.local
```

Should show: `NEXT_PUBLIC_API_URL=http://localhost:5000`

**Check 4: Test API directly**
```bash
curl http://localhost:5000/api/vendor
```

Should return JSON with vendors array.

---

### Error: Port 3000 already in use (Frontend)

Next.js will automatically try 3001, 3002, etc. Just press `Y` when prompted.

Or manually specify a different port:
```bash
PORT=3001 npm run dev
```

Then update browser URL accordingly.

---

### Error: Port 5000 already in use (Backend)

Something else is using port 5000. Either:

**Option A: Kill the process**
```bash
netstat -ano | findstr :5000
taskkill /PID <PID_NUMBER> /F
```

**Option B: Change backend port**
Edit `backend/.env`:
```env
PORT=5001
```

Edit `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5001
```

Restart both servers.

---

### No data showing (Empty tables)

**Check database has data:**
```bash
cd backend
node check-data.js
```

**If shows 0 vendors:**
```bash
node test-integration.js
```

This will create test data.

---

## Verify Everything Works

### 1. Backend Health Check
```bash
curl http://localhost:5000/health
```

✅ Should return JSON with `"status": "healthy"`

---

### 2. Test Vendor API
```bash
curl http://localhost:5000/api/vendor
```

✅ Should return JSON with vendors array

---

### 3. Test Frontend Pages

Open browser and test each page:

**Dashboard (`/`)**
- Should show 4 metric cards
- Should show recent vendors table
- No "Failed to load vendors" error

**Vendors (`/vendors`)**
- Should show vendor table
- Columns: Vendor, Email, Phone, Created, Action

**Workflow Details (`/workflow/:id`)**
- Click "View Details" on any vendor
- Should show multiple cards with workflow data

**Approvals (`/approvals`)**
- Should show approvals list (may be empty if no approvals)

---

## Current Configuration

### Backend
- **Port:** 5000
- **Database:** SQLite (`backend/prisma/dev.db`)
- **API Base:** `http://localhost:5000`

### Frontend
- **Port:** 3000
- **Backend URL:** `http://localhost:5000`
- **Framework:** Next.js 16

---

## Files Modified (Port Fix)

1. ✅ `backend/.env` - Changed PORT from 3000 to 5000
2. ✅ `backend/.env.example` - Updated PORT to 5000
3. ✅ `backend/src/server.js` - Changed default from 3000 to 5000

---

## Database Status

Current data (as of last check):
- **Vendors:** 1
- **Workflows:** 15
- **Approvals:** 0

To add more test data:
```bash
cd backend
node test-integration.js
```

---

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| ERR_CONNECTION_REFUSED | Backend not running - start it |
| Failed to load vendors | Check backend is on port 5000 |
| Port already in use | Change port or kill process |
| Empty dashboard | Run test-integration.js to create data |
| CORS error | Backend has CORS enabled, should work |
| TypeScript errors | Run `npm run build` to check |

---

## Full Reset (If needed)

If everything is broken, start fresh:

### 1. Stop all servers
```bash
# Press Ctrl+C in both terminals
```

### 2. Verify ports are free
```bash
netstat -ano | findstr :3000
netstat -ano | findstr :5000
```

### 3. Check configuration files
```bash
# Backend
cat backend/.env | findstr PORT

# Frontend
cat frontend/.env.local
```

### 4. Restart backend
```bash
cd backend
npm start
```

Wait for "Server started on port 5000"

### 5. Restart frontend
```bash
cd frontend
npm run dev
```

Wait for "Ready in X.Xs"

### 6. Test in browser
Open `http://localhost:3000`

---

## Success Checklist

Before demo, verify:

- [ ] Backend running on port 5000
- [ ] Frontend running on port 3000
- [ ] Health check returns healthy: `curl http://localhost:5000/health`
- [ ] API returns data: `curl http://localhost:5000/api/vendor`
- [ ] Dashboard loads without errors
- [ ] Vendors page shows table
- [ ] Workflow details page works
- [ ] Approvals page loads
- [ ] No console errors in browser (F12)

---

## Demo Flow

1. **Show Dashboard** - Vendor metrics
2. **Click Vendors** - Full vendor list
3. **Click View Details** - Workflow details with all sections
4. **Click Approvals** - Approval management

---

## Need Help?

1. Check both terminals for error messages
2. Check browser console (F12) for errors
3. Test API endpoints with curl
4. Verify database has data: `node check-data.js`
5. Review this guide again

---

## Quick Commands Reference

```bash
# Check if backend is running
curl http://localhost:5000/health

# Check if API works
curl http://localhost:5000/api/vendor

# Check database data
cd backend && node check-data.js

# Create test data
cd backend && node test-integration.js

# Restart backend
cd backend && npm start

# Restart frontend
cd frontend && npm run dev
```

---

✅ **The system is now properly configured and ready to run!**

**Next Step:** Open 2 terminals, start backend and frontend, then open browser.
