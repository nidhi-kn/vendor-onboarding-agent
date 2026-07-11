<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# Vendor Onboarding AI Agent Dashboard

## Project Context
This frontend is the **admin dashboard** for a Vendor Onboarding AI Agent system. The backend is a Node.js/Express API with a Telegram connector for vendor communication and an AI planner agent that orchestrates multi-step onboarding workflows.

## Tech Stack
- **Next.js 16.2.10** (App Router)
- **React 19.2.4**
- **TypeScript 5**
- **TailwindCSS 4** (new syntax with `@import "tailwindcss"`)
- **Axios** for API calls
- **Lucide React** for icons

## Backend API Endpoints
```
Base URL: http://localhost:5000

GET  /api/vendors              → List all vendors
GET  /api/vendor/:id           → Vendor details
GET  /api/workflow/:id         → Workflow details with timeline
GET  /api/approvals            → List all pending approvals
POST /api/approval/:workflowId → Submit approval decision
GET  /api/logs                 → All audit logs
GET  /api/logs/:workflowId     → Workflow-specific logs
```

## Project Structure Rules

### Folder Organization
```
frontend/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Dashboard home (TODO)
│   ├── layout.tsx         # Root layout (keep)
│   ├── globals.css        # Global styles (keep)
│   ├── vendors/           # Vendor pages (TODO)
│   ├── workflows/         # Workflow pages (TODO)
│   ├── approvals/         # Approval queue (TODO)
│   └── logs/              # Audit logs (TODO)
├── components/             # Reusable React components (TODO)
├── services/               # API service layer (TODO)
├── types/                  # TypeScript interfaces (TODO)
├── lib/                    # Utility functions (TODO)
└── public/                 # Static assets (empty, ready for logos/icons)
```

### Code Conventions

#### 1. API Service Pattern
All backend calls go through service files in `services/`:
```typescript
// services/api.ts
import axios from 'axios';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
  headers: { 'Content-Type': 'application/json' }
});

// services/vendorService.ts
import { api } from './api';

export const vendorService = {
  getAll: () => api.get('/api/vendors'),
  getById: (id: string) => api.get(`/api/vendor/${id}`)
};
```

#### 2. TypeScript Interfaces
Create interfaces in `types/` matching backend Prisma schema:
```typescript
// types/vendor.ts
export interface Vendor {
  id: string;
  companyName: string;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}
```

#### 3. Component Patterns
- Use **Server Components** by default (faster, less JS to client)
- Add `"use client"` only when needed (forms, interactivity, hooks)
- Keep components small and focused
- Use Lucide React for icons: `import { CheckCircle } from 'lucide-react'`

#### 4. Styling with TailwindCSS 4
- Use Tailwind utility classes for styling
- Responsive design: `md:`, `lg:` breakpoints
- Dark mode support: `dark:` prefix
- Custom CSS variables in `globals.css` if needed

#### 5. Error Handling
- Wrap API calls in try/catch
- Show user-friendly error messages
- Use React toast library for notifications (to be added)

## Backend Schema Reference

### Key Entities (from Prisma schema)
- **Vendor** - Company being onboarded
- **Workflow** - Onboarding workflow instance for a vendor
- **Message** - Telegram messages between vendor and agent
- **Document** - Files uploaded by vendor (PDF, images)
- **Approval** - Human approval requests for workflow decisions
- **AuditLog** - Complete audit trail for compliance

### Workflow States
- `INITIATED` - Workflow started
- `IN_PROGRESS` - Agent is collecting information
- `PENDING_APPROVAL` - Waiting for human approval
- `APPROVED` - Workflow approved
- `REJECTED` - Workflow rejected
- `COMPLETED` - Onboarding complete
- `FAILED` - Workflow failed with errors

## Development Workflow

### 1. Type-First Development
- Define TypeScript interfaces BEFORE building components
- Match backend Prisma schema exactly
- Use strict mode (already configured in tsconfig.json)

### 2. Build Order
1. Create types matching backend schema
2. Create API service layer
3. Build shared components (Navbar, Loading, Error)
4. Build pages starting with simplest (list) to complex (detail)

### 3. Testing Strategy
- Start backend server on `localhost:5000`
- Use Prisma Studio to verify database has test data
- Test API endpoints with Postman/curl BEFORE building UI
- Verify frontend calls return expected data

## Common Pitfalls to Avoid

❌ **DON'T** use `pages/` directory (this is App Router, not Pages Router)  
✅ **DO** use `app/` directory for all routes

❌ **DON'T** fetch data in `useEffect` in Server Components  
✅ **DO** use `async/await` directly in Server Components

❌ **DON'T** hardcode API URL as `http://localhost:5000`  
✅ **DO** use `process.env.NEXT_PUBLIC_API_URL` with fallback

❌ **DON'T** create duplicate API logic in multiple places  
✅ **DO** centralize all API calls in service files

❌ **DON'T** ignore TypeScript errors  
✅ **DO** fix type errors before committing

## Environment Variables

Create `.env.local` in frontend root:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

This is NOT created yet - needs to be added manually when starting development.

## Ready to Build?

1. Read `FRONTEND_ANALYSIS_REPORT.md` for complete analysis
2. Check `trash/TRASH_SUMMARY.md` to see what was removed
3. Start with creating types and API service layer
4. Build dashboard home page with summary cards
5. Add vendor list and detail pages

---

**Last Updated:** July 11, 2026  
**Status:** Clean foundation ready for development
