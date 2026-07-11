# Getting Started - Vendor Onboarding AI Agent

**5-minute guide to get the system running on your machine.**

---

## Prerequisites

Before you start, ensure you have:

✅ **Node.js** v18 or higher ([Download](https://nodejs.org))  
✅ **npm** v9 or higher (comes with Node.js)  
✅ **Groq API Key** ([Get free key](https://console.groq.com))  
✅ **Git** (optional, for cloning)

---

## Step 1: Install

```bash
# Clone the repository
git clone <repository-url>
cd vendor-onboarding-agent/backend

# Install dependencies
npm install
```

This installs:
- Express (web server)
- Prisma (database)
- Groq SDK (AI)
- Telegram Bot API
- And other dependencies

---

## Step 2: Configure Environment

Create `.env` file:

```bash
# Copy example
cp .env.example .env
```

Edit `.env` and add your Groq API key:

```bash
# Minimum required configuration
DATABASE_URL="file:./prisma/dev.db"
PORT=3000
GROQ_API_KEY=your_actual_groq_api_key_here

# Optional: For Telegram integration
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
API_BASE_URL=http://localhost:3000
```

**Get Groq API Key**:
1. Go to https://console.groq.com
2. Sign up (free)
3. Generate API key
4. Copy to `.env`

---

## Step 3: Setup Database

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy
```

This creates SQLite database at `prisma/dev.db` with all tables.

---

## Step 4: Start Backend

```bash
npm start
```

You should see:
```json
{
  "timestamp": "2026-07-11T...",
  "level": "info",
  "service": "Server",
  "message": "Server started on port 3000",
  "port": 3000
}
```

**Backend is now running at**: http://localhost:3000

---

## Step 5: Test the System

Open a **new terminal** and run tests:

```bash
# Test connector layer
npm run test:connectors
```

Expected output:
```
TESTING CONNECTOR LAYER
✓ Abstract interface enforces contract
✓ Registry prevents duplicates
✓ Mock ERP demonstrates integration pattern
✓ Message normalization removes external specifics
✓ Retry logic with exponential backoff
✓ Metrics tracking for observability
✓ Health checks for monitoring

ALL CONNECTOR TESTS PASSED ✓
```

```bash
# Test API layer (backend must be running)
npm run test:api
```

Expected output:
```
TESTING REST API LAYER
✓ Health Check
✓ POST /api/workflow/process
✓ GET /api/workflow/:id
✓ POST /api/connector/message
✓ GET /api/vendor/:id
✓ GET /api/timeline/:workflowId

API TESTS COMPLETED ✓
```

```bash
# Test complete integration (backend must be running)
npm run test:integration
```

Expected output:
```
END-TO-END INTEGRATION TEST
✓ Vendor Sends Initial Message
✓ Vendor Provides Company Details
✓ Workflow Details Retrieved
✓ Vendor Found in Database
✓ Messages Saved
✓ Audit Log Created
✓ Agent Runs Recorded

ALL INTEGRATION TESTS PASSED ✓
```

---

## ✅ System is Running!

Your vendor onboarding system is now operational.

### What's Running?

**Backend API** (http://localhost:3000):
- Workflow processing
- Vendor management
- Document handling
- Approval workflows
- Audit logging

**Database** (`prisma/dev.db`):
- Vendors
- Workflows
- Messages
- Documents
- Approvals
- Agent runs
- Audit logs

---

## Next Steps

### Option 1: Test via HTTP

Test the API manually:

```bash
# Health check
curl http://localhost:3000/health

# Process a workflow
curl -X POST http://localhost:3000/api/workflow/process \
  -H "Content-Type: application/json" \
  -d '{
    "workflowId": "test_workflow_1",
    "trigger": "user_message",
    "incomingMessage": {
      "messageType": "text",
      "content": "Hi, I want to register as a vendor",
      "senderName": "Test User",
      "senderId": "test_123"
    }
  }'
```

### Option 2: Connect Telegram Bot

**Step 1**: Get Telegram bot token
1. Open Telegram
2. Search for `@BotFather`
3. Send `/newbot` command
4. Follow instructions
5. Copy token

**Step 2**: Add token to `.env`
```bash
TELEGRAM_BOT_TOKEN=your_token_here
```

**Step 3**: Start connectors (new terminal)
```bash
npm run start:connectors
```

**Step 4**: Test in Telegram
1. Find your bot in Telegram
2. Send: "Hi, I want to register as a vendor"
3. Bot should respond with onboarding instructions

### Option 3: View Database

```bash
# Open Prisma Studio (GUI)
npx prisma studio
```

Opens at http://localhost:5555

Browse:
- Vendors
- Workflows
- Messages
- Documents
- Audit logs

---

## Common Issues

### "GROQ_API_KEY is required"

**Problem**: Environment variable not set

**Solution**: 
1. Check `.env` file exists
2. Verify `GROQ_API_KEY=...` is set
3. Restart server

### "Port 3000 already in use"

**Problem**: Another process using port 3000

**Solution**:
```bash
# Windows: Kill process
netstat -ano | findstr :3000
taskkill /PID <pid> /F

# Or change port in .env
PORT=3001
```

### "Database connection failed"

**Problem**: Prisma client not generated or migrations not run

**Solution**:
```bash
npx prisma generate
npx prisma migrate deploy
```

### Tests failing

**Problem**: Backend not running

**Solution**:
```bash
# Start backend first
npm start

# Then run tests in another terminal
npm run test:api
```

---

## Understanding the System

### Architecture

```
External Systems (Telegram/WhatsApp)
        ↓
Connector Layer
        ↓
HTTP POST /api/connector/message
        ↓
REST API Layer
        ↓
Workflow Runtime
        ↓
AI Planner (Groq)
        ↓
Tool Executor
        ↓
Business Tools
        ↓
Database (SQLite)
```

### Key Concepts

**Workflow**: A vendor onboarding process
- States: INITIATED → WAITING_VENDOR_DETAILS → WAITING_DOCUMENTS → PENDING_APPROVAL → APPROVED
- Each workflow tied to one vendor
- Tracks all messages and documents

**Planner**: AI that makes decisions
- Analyzes current state
- Decides next actions
- Generates responses
- Selects tools to execute

**Tools**: Actions the planner can take
- save_message - Save conversation
- create_vendor - Create vendor record
- update_vendor - Update vendor details
- upload_document - Save document
- create_approval - Create approval request
- update_workflow_state - Change state

**Connectors**: Transport adapters
- Telegram, WhatsApp, ERP, etc.
- Convert external messages to standard format
- Send responses back

---

## File Structure

```
backend/
├── src/
│   ├── agent/              # AI planner
│   ├── connectors/         # Transport adapters
│   ├── controllers/        # HTTP controllers
│   ├── services/           # Orchestration
│   ├── routes/             # API routes
│   ├── repositories/       # Database access
│   ├── runtime/            # Workflow engine
│   ├── tools/              # Business tools
│   ├── app.js              # Express app
│   └── server.js           # Server start
├── prisma/
│   ├── schema.prisma       # Database schema
│   └── migrations/         # Database migrations
├── test-connectors.js      # Connector tests
├── test-api.js             # API tests
├── test-integration.js     # End-to-end tests
├── start-connectors.js     # Start connectors
└── package.json            # Dependencies
```

---

## API Endpoints

**Health Check**:
```
GET /health
```

**Process Workflow**:
```
POST /api/workflow/process
Body: { workflowId, trigger, incomingMessage }
```

**Connector Message** (used by connectors):
```
POST /api/connector/message
Body: { connectorId, workflowId, channelId, senderId, text, ... }
```

**Get Workflow**:
```
GET /api/workflow/:workflowId
```

**Get Vendor**:
```
GET /api/vendor/:vendorId
```

**Get Timeline** (audit trail):
```
GET /api/timeline/:workflowId
```

**Approval**:
```
POST /api/approval/:workflowId
Body: { action: 'approve' | 'reject', reason, approvedBy }
```

See [API_LAYER.md](./API_LAYER.md) for details.

---

## Scripts

```bash
# Start backend
npm start

# Start connectors
npm run start:connectors

# Run all tests
npm run test:all

# Individual tests
npm run test:connectors
npm run test:api
npm run test:integration

# View database
npx prisma studio

# Reset database
npx prisma migrate reset
```

---

## Documentation

**Quick Start**:
- [GETTING_STARTED.md](./GETTING_STARTED.md) (this file)

**Project Overview**:
- [README.md](./README.md) - Complete project documentation

**Architecture**:
- [API_LAYER.md](./API_LAYER.md) - REST API documentation
- [CONNECTOR_LAYER.md](./CONNECTOR_LAYER.md) - Connector documentation
- [PERSISTENCE_LAYER.md](./backend/PERSISTENCE_LAYER.md) - Database documentation

**Deployment**:
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - Production deployment

**Implementation Details**:
- [PHASE_5_SUMMARY.md](./PHASE_5_SUMMARY.md) - API layer details
- [PHASE_6_SUMMARY.md](./PHASE_6_SUMMARY.md) - Connector layer details
- [SYSTEM_COMPLETE.md](./SYSTEM_COMPLETE.md) - Complete system overview

---

## Need Help?

**Check documentation**:
1. Start with [README.md](./README.md)
2. For API: [API_LAYER.md](./API_LAYER.md)
3. For connectors: [CONNECTOR_LAYER.md](./CONNECTOR_LAYER.md)
4. For deployment: [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

**Run tests**:
```bash
npm run test:all
```

**Check logs**: Server logs show what's happening

**View database**: 
```bash
npx prisma studio
```

---

## You're Ready!

Your vendor onboarding AI agent is:
- ✅ Installed
- ✅ Configured
- ✅ Running
- ✅ Tested

**Next**:
1. Explore the API endpoints
2. Connect a Telegram bot
3. Build a dashboard
4. Deploy to production

**Happy building! 🚀**

