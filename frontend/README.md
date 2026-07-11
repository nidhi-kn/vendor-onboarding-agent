# Vendor Onboarding Dashboard

A Next.js 16 dashboard for managing AI-powered vendor onboarding workflows.

## Features

- **Dashboard**: Overview with vendor metrics (Total, Pending, Approved, Rejected)
- **Vendors**: List all vendors with status and details
- **Workflow Details**: View complete workflow information including documents, conversation, and timeline
- **Approvals**: Approve or reject pending vendor workflows

## Tech Stack

- Next.js 16.2.10 (App Router)
- React 19.2.4
- TypeScript 5
- TailwindCSS 4
- Axios for API calls

## Prerequisites

- Node.js 18+ installed
- Backend server running on `http://localhost:5000`

## Installation

```bash
npm install
```

## Configuration

The `.env.local` file is already configured:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

To change the backend URL, edit `.env.local`.

## Running the Application

### Development Mode

```bash
npm run dev
```

The dashboard will be available at `http://localhost:3000`

### Production Build

```bash
npm run build
npm start
```

## Project Structure

```
frontend/
├── app/                          # Next.js App Router pages
│   ├── page.tsx                 # Dashboard home
│   ├── layout.tsx               # Root layout with Navbar
│   ├── vendors/
│   │   └── page.tsx            # Vendors list
│   ├── workflow/
│   │   └── [id]/
│   │       └── page.tsx        # Workflow details (dynamic route)
│   └── approvals/
│       └── page.tsx            # Approvals queue
├── components/                   # Reusable components
│   ├── Navbar.tsx
│   ├── Card.tsx
│   ├── Badge.tsx
│   ├── Loading.tsx
│   └── EmptyState.tsx
├── services/                     # API service layer
│   ├── api.ts                   # Axios instance
│   ├── vendorService.ts
│   ├── workflowService.ts
│   └── approvalService.ts
└── types/
    └── index.ts                 # TypeScript interfaces
```

## Pages

### 1. Dashboard (`/`)
- Displays 4 metric cards: Total Vendors, Pending, Approved, Rejected
- Shows recent vendors table
- Calculates counts from vendor list

### 2. Vendors (`/vendors`)
- Lists all vendors in a table
- Columns: Vendor, Email, Status, Created, Action
- Click "View Details" to navigate to workflow details

### 3. Workflow Details (`/workflow/[id]`)
- Vendor Information card
- Workflow State card
- Documents list (with download links)
- Conversation history
- Planner Decision (context JSON)
- Approval Status
- Timeline events

### 4. Approvals (`/approvals`)
- Lists all approval requests
- Approve/Reject buttons for pending approvals
- Auto-refreshes after decision submission

## Backend API Endpoints Used

```
GET  /api/vendors              → List all vendors
GET  /api/vendor/:id           → Vendor details
GET  /api/workflow/:id         → Workflow details
GET  /api/approvals            → List approvals
POST /api/approval/:workflowId → Submit approval decision
```

## Connecting to Backend

### Step 1: Start Backend Server

```bash
cd backend
npm start
```

Backend should be running on `http://localhost:5000`

### Step 2: Verify Backend is Running

```bash
curl http://localhost:5000/api/vendors
```

You should see a JSON response with vendor data.

### Step 3: Start Frontend

```bash
cd frontend
npm run dev
```

Open `http://localhost:3000` in your browser.

## Data Flow

1. Frontend makes HTTP requests to backend via Axios
2. Services (`vendorService`, `workflowService`, `approvalService`) handle API calls
3. Pages use React hooks (`useState`, `useEffect`) to fetch and display data
4. No mock data - all data comes from backend

## Status Badge Colors

- **Green**: Approved workflows
- **Red**: Rejected workflows
- **Yellow**: Pending/In-Progress workflows
- **Blue**: Info states

## Troubleshooting

### Backend Connection Error

If you see "Failed to load vendors":
1. Check backend is running: `curl http://localhost:5000/api/vendors`
2. Check `.env.local` has correct URL
3. Check browser console for CORS errors

### Build Errors

If TypeScript errors occur:
```bash
npm run build
```

Fix any reported type errors before running `npm run dev`.

### Port Already in Use

If port 3000 is busy:
```bash
# Next.js will automatically try port 3001, 3002, etc.
npm run dev
```

Or specify a different port:
```bash
PORT=3001 npm run dev
```

## Demo Workflow

1. **View Dashboard**: See vendor metrics at a glance
2. **Browse Vendors**: Click "Vendors" in navbar to see all vendors
3. **View Details**: Click "View Details" on any vendor to see workflow
4. **Approve/Reject**: Go to "Approvals" to manage pending requests

## Notes

- No authentication implemented (as per requirements)
- No notifications/toasts (using browser alerts for errors)
- No settings page
- All data is real-time from backend
- Components are minimal and focused on demo needs

## Interview Demo Checklist

- ✅ Dashboard with metrics
- ✅ Vendors list table
- ✅ Workflow details page with all sections
- ✅ Approvals with approve/reject buttons
- ✅ Clean, professional UI
- ✅ Real backend integration
- ✅ TypeScript typed
- ✅ Responsive design
- ✅ Loading states
- ✅ Error handling

## Built With

This dashboard was built specifically for the vendor onboarding AI agent demo. It connects directly to the existing Node.js/Express backend with Prisma ORM and displays real workflow data managed by the AI planner agent.
