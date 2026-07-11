# 🚀 How to Run the Vendor Onboarding Demo

## Quick Start (3 Steps)

### Step 1: Start Backend Server

```bash
cd backend
npm start
```

**Expected Output:**
```
Server listening on port 5000
Database connected
```

Backend URL: `http://localhost:5000`

---

### Step 2: Start Frontend Dashboard

Open a **new terminal window**:

```bash
cd frontend
npm run dev
```

**Expected Output:**
```
▲ Next.js 16.2.10
- Local:        http://localhost:3000
- Environments: .env.local

✓ Starting...
✓ Ready in 2.1s
```

Frontend URL: `http://localhost:3000`

---

### Step 3: Open Browser

Navigate to: **`http://localhost:3000`**

You should see the Dashboard with vendor metrics.

---

## Verify Backend is Working

Before starting frontend, test backend endpoints:

```bash
# Test vendors endpoint
curl http://localhost:5000/api/vendors

# Test approvals endpoint
curl http://localhost:5000/api/approvals
```

Both should return JSON arrays. If you get connection errors, the backend is not running.

---

## Demo Flow

### 1. Dashboard Page (`/`)
- View 4 metric cards: Total Vendors, Pending, Approved, Rejected
- See recent vendors table
- Click "View all vendors →" to go to Vendors page

### 2. Vendors Page (`/vendors`)
- See full vendor list with Email, Status, Created date
- Click "View Details" on any vendor

### 3. Workflow Details Page (`/workflow/[id]`)
- Vendor Information
- Workflow State and Status
- Documents (if uploaded)
- Conversation history
- Planner Decision (JSON context)
- Approval Status
- Timeline events

### 4. Approvals Page (`/approvals`)
- See pending approval requests
- Click "Approve" (green button) to approve
- Click "Reject" (red button) to reject
- Page refreshes after decision

---

## Troubleshooting

### Backend Connection Failed

**Symptom:** Dashboard shows "Failed to load vendors" error

**Fix:**
1. Check backend is running: `curl http://localhost:5000/api/vendors`
2. If nothing responds, start backend: `cd backend && npm start`
3. If backend fails to start, check `.env` file exists with `DATABASE_URL` and `GROQ_API_KEY`

### Port 3000 Already in Use

**Symptom:** Frontend shows "Port 3000 is already in use"

**Fix:**
Next.js will automatically try port 3001, 3002, etc. Just press `Y` when prompted, or kill the process using port 3000:

```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID_NUMBER> /F

# Then restart: npm run dev
```

### Page Shows "No data available"

**Symptom:** Workflow details page shows "No data available" in all sections

**Fix:**
1. Check that backend has data: Open Prisma Studio
   ```bash
   cd backend
   npx prisma studio
   ```
2. Verify tables have records: Vendor, Workflow, Message, Document, Approval
3. If empty, run integration test to create test data:
   ```bash
   cd backend
   node test-integration.js
   ```

### Build Errors

**Symptom:** `npm run build` fails with TypeScript errors

**Fix:**
1. Check Node.js version: `node --version` (should be 18+)
2. Delete node_modules and reinstall:
   ```bash
   cd frontend
   rmdir /s /q node_modules
   npm install
   npm run build
   ```

---

## Environment Variables

### Backend `.env`
Located at: `backend/.env`

Required variables:
```env
DATABASE_URL="file:./prisma/dev.db"
GROQ_API_KEY="your-api-key-here"
GROQ_MODEL="llama-3.3-70b-versatile"
PORT=5000
```

### Frontend `.env.local`
Located at: `frontend/.env.local`

Required variables:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

**Note:** Frontend reads `NEXT_PUBLIC_API_URL` from `.env.local`. If you change backend port, update this file.

---

## Project Structure

```
vendor-onboarding-agent/
├── backend/                      # Node.js/Express API
│   ├── src/
│   ├── prisma/
│   ├── package.json
│   └── .env                      ← Backend config
│
├── frontend/                     # Next.js Dashboard
│   ├── app/                      ← Pages
│   ├── components/               ← Reusable UI
│   ├── services/                 ← API clients
│   ├── types/                    ← TypeScript types
│   ├── package.json
│   └── .env.local                ← Frontend config
│
└── Documentation
    ├── API_ENDPOINTS_SUMMARY.md
    ├── TASK_10_COMPLETE.md
    └── HOW_TO_RUN_DEMO.md        ← This file
```

---

## Testing the Demo

### Test Case 1: View Dashboard Metrics

1. Open `http://localhost:3000`
2. Verify 4 metric cards display numbers
3. Verify recent vendors table shows data

**Expected:** Metrics calculated from vendor list, recent vendors displayed

---

### Test Case 2: Browse All Vendors

1. Click "Vendors" in navbar
2. Verify vendor table loads
3. Check columns: Vendor, Email, Status, Created, Action

**Expected:** All vendors from backend displayed

---

### Test Case 3: View Workflow Details

1. Go to Vendors page
2. Click "View Details" on any vendor
3. Verify all cards load:
   - Vendor Information
   - Workflow State
   - Documents
   - Conversation
   - Planner Decision
   - Approval Status
   - Timeline

**Expected:** Complete workflow data displayed, no "No data available" if data exists

---

### Test Case 4: Approve a Workflow

1. Click "Approvals" in navbar
2. Find a PENDING approval
3. Click "Approve" button
4. Wait for "Processing..." to finish
5. Verify status changes to APPROVED

**Expected:** Page refreshes, approval status updated

---

### Test Case 5: Reject a Workflow

1. Go to Approvals page
2. Find another PENDING approval
3. Click "Reject" button
4. Wait for processing
5. Verify status changes to REJECTED

**Expected:** Page refreshes, approval status updated

---

## Demo Script for Interview

### Opening (30 seconds)

> "This is a vendor onboarding system powered by an AI agent. The backend uses an LLM planner to orchestrate multi-step workflows, and this dashboard lets admins monitor and approve vendor onboarding requests."

### Show Dashboard (1 minute)

1. **Point to metrics:** "Here we see total vendors and their status breakdown."
2. **Point to recent vendors:** "Below are the most recent onboarding requests."
3. **Click Vendors:** "Let's view all vendors..."

### Show Vendors List (30 seconds)

1. **Point to table:** "Each vendor has an email, status, and creation date."
2. **Click View Details:** "Let's drill into one workflow..."

### Show Workflow Details (2 minutes)

1. **Vendor Information card:** "Company details collected by the agent."
2. **Workflow State card:** "Current state and status."
3. **Documents card:** "Files uploaded by the vendor through Telegram."
4. **Conversation card:** "Message history between vendor and AI agent."
5. **Planner Decision card:** "The agent's reasoning and tool calls."
6. **Timeline card:** "Complete audit trail of the workflow."

### Show Approvals (1 minute)

1. **Point to pending approvals:** "The agent requested human approval here."
2. **Click Approve:** "I can approve..."
3. **Show refresh:** "...and the system updates in real-time."

### Closing (30 seconds)

> "The agent handles conversation, document extraction, vendor data validation, and workflow orchestration. Humans step in only for approval decisions. Everything is persisted in the database with full audit logging."

**Total Demo Time:** ~5 minutes

---

## API Integration Details

### Service Layer Pattern

Frontend uses a clean service layer:

```typescript
// services/vendorService.ts
import { api } from './api';

export const vendorService = {
  getAll: async () => {
    const response = await api.get('/api/vendors');
    return response.data;
  }
};
```

### Component Data Fetching

Pages use React hooks:

```typescript
const [vendors, setVendors] = useState<Vendor[]>([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  loadVendors();
}, []);

const loadVendors = async () => {
  try {
    const data = await vendorService.getAll();
    setVendors(data);
  } catch (err) {
    setError('Failed to load');
  } finally {
    setLoading(false);
  }
};
```

### Error Handling

All API calls wrapped in try/catch with user feedback:

```typescript
{error && (
  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
    {error}
  </div>
)}
```

---

## Production Deployment (Optional)

### Build for Production

```bash
cd frontend
npm run build
npm start
```

Frontend will run on port 3000 in production mode.

### Environment Variables for Production

Create `frontend/.env.production`:

```env
NEXT_PUBLIC_API_URL=https://your-backend-url.com
```

---

## Common Commands

### Backend

```bash
# Start server
npm start

# Run integration tests
node test-integration.js

# Open Prisma Studio (view database)
npx prisma studio

# Reset database
npx prisma migrate reset
```

### Frontend

```bash
# Development mode
npm run dev

# Production build
npm run build

# Start production server
npm start

# Check for errors
npm run lint
```

---

## Success Checklist

Before demo:

- [ ] Backend running on port 5000
- [ ] Frontend running on port 3000
- [ ] Database has vendor data (check Prisma Studio)
- [ ] All pages load without errors
- [ ] Approve/Reject buttons work
- [ ] Navigation links work
- [ ] No console errors in browser

---

## Support

If issues persist:

1. **Check logs:** Backend terminal shows API request logs
2. **Check browser console:** Press F12, check Console tab for errors
3. **Check network tab:** Press F12, Network tab, verify API calls succeed
4. **Restart both servers:** Ctrl+C to stop, then restart
5. **Clear build cache:**
   ```bash
   cd frontend
   rmdir /s /q .next
   npm run dev
   ```

---

## Summary

**Backend:** Node.js + Express + Prisma + SQLite  
**Frontend:** Next.js 16 + React 19 + TypeScript + TailwindCSS  
**Communication:** REST API with Axios  
**Data:** Real-time from database, no mocks  

**Start Command:**
```bash
# Terminal 1
cd backend && npm start

# Terminal 2
cd frontend && npm run dev

# Browser: http://localhost:3000
```

**Demo is ready! 🎉**
