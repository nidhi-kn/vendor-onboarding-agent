# REST API Layer Documentation

## Overview

Phase 5 adds a **lightweight REST API layer** that exposes the existing backend through clean HTTP endpoints. This allows future connectors (Telegram, WhatsApp, Dashboard) and integrations (ERP) to interact with the system without directly importing backend modules.

---

## Architecture Principle

**The API layer is a thin orchestration layer.** It contains **ZERO business logic**.

```
External Systems → REST API → Services → Runtime/Repositories → Database
```

All business logic remains in:
- ✅ Planner Agent
- ✅ Workflow Runtime
- ✅ Tool Executor
- ✅ Business Tools
- ✅ Repositories

---

## Project Structure

###  Created Folders

```
backend/src/
├── routes/           # HTTP route definitions
├── controllers/      # Request validation & response formatting
├── services/         # Orchestration (calls runtime/repositories)
└── middleware/       # Express middleware (logging, errors)
```

### Files Created

**Middleware (3 files)**:
- `middleware/requestLogger.js` - Logs incoming requests with timing
- `middleware/errorHandler.js` - Centralized error handling
- `middleware/notFound.js` - 404 handler

**Services (2 files)**:
- `services/workflow.service.js` - Orchestrates workflow operations
- `services/connector.service.js` - Handles connector messages

**Controllers (5 files)**:
- `controllers/workflow.controller.js` - Workflow endpoints
- `controllers/connector.controller.js` - Connector endpoints
- `controllers/vendor.controller.js` - Vendor endpoints
- `controllers/approval.controller.js` - Approval endpoints
- `controllers/timeline.controller.js` - Timeline endpoints

**Routes (5 files)**:
- `routes/workflow.routes.js` - Workflow routes
- `routes/connector.routes.js` - Connector routes
- `routes/vendor.routes.js` - Vendor routes
- `routes/approval.routes.js` - Approval routes
- `routes/timeline.routes.js` - Timeline routes

**Application**:
- `app.js` - Express app configuration
- `server.js` - Server entry point with graceful shutdown

**Testing**:
- `test-api.js` - API endpoint tests

---

## API Endpoints

### 1. POST /api/workflow/process

**Purpose**: Process workflow event through runtime

**Request Body**:
```json
{
  "workflowId": "workflow_123",
  "trigger": "user_message",
  "incomingMessage": {
    "messageType": "text",
    "content": "Hi, I want to register as a vendor",
    "senderName": "John Doe",
    "senderId": "user_123"
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "workflowState": "WAITING_VENDOR_DETAILS",
    "responseMessage": "Welcome! Please provide...",
    "executionPlan": {
      "executionTasks": [...]
    }
  },
  "metadata": {
    "timestamp": "2026-07-11T08:00:00.000Z"
  }
}
```

**Flow**:
```
Controller → WorkflowService.processWorkflow()
          → WorkflowRuntime.execute()
          → Planner → Dispatcher → ToolExecutor
```

---

### 2. POST /api/connector/message

**Purpose**: Receive normalized message from external connector

**Request Body**:
```json
{
  "connectorId": "telegram",
  "workflowId": "workflow_123",
  "channelId": "chat_456",
  "senderId": "user_123",
  "senderName": "John Doe",
  "text": "Hi, I want to register",
  "attachments": []
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "connectorId": "telegram",
    "workflowId": "workflow_123",
    "processed": true,
    "result": {
      "workflowState": "...",
      "responseMessage": "..."
    }
  },
  "metadata": {
    "timestamp": "2026-07-11T08:00:00.000Z"
  }
}
```

**Flow**:
```
Controller → ConnectorService.processMessage()
          → WorkflowService.processIncomingMessage()
          → WorkflowRuntime.execute()
```

**Purpose**: This is where future Telegram/WhatsApp/Email connectors will plug in.

---

### 3. GET /api/workflow/:id

**Purpose**: Get complete workflow details

**Response**:
```json
{
  "success": true,
  "data": {
    "workflow": {
      "id": "workflow_123",
      "currentState": "WAITING_GST",
      "previousState": "WAITING_VENDOR_DETAILS",
      "stateHistory": ["START", "WAITING_VENDOR_DETAILS", "WAITING_GST"],
      "createdAt": "...",
      "updatedAt": "..."
    },
    "vendor": {
      "id": "vendor_123",
      "companyName": "Test Corp",
      "email": "test@example.com"
    },
    "documents": [
      {
        "id": "doc_1",
        "documentType": "gst_certificate",
        "status": "pending",
        "uploadedAt": "..."
      }
    ],
    "conversationSummary": {
      "messageCount": 5,
      "recentMessages": [...]
    },
    "approval": {
      "status": "pending",
      "requestedAt": "..."
    },
    "timeline": [...]
  },
  "metadata": {
    "timestamp": "2026-07-11T08:00:00.000Z"
  }
}
```

**Flow**:
```
Controller → WorkflowService.getWorkflowDetails()
          → WorkflowRepository.findById()
          → VendorRepository.findById()
          → DocumentRepository.listByWorkflowId()
          → MessageRepository.listByWorkflowId()
          → ApprovalRepository.findByWorkflowId()
          → AuditLogRepository.listByWorkflowId()
```

---

### 4. GET /api/vendor/:id

**Purpose**: Get vendor details

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "vendor_123",
    "companyName": "Test Corp",
    "contactPerson": "John Doe",
    "email": "john@test.com",
    "phone": "+91-9876543210",
    "gstNumber": "GST123",
    "panNumber": "PAN123",
    "createdAt": "...",
    "updatedAt": "..."
  },
  "metadata": {
    "timestamp": "2026-07-11T08:00:00.000Z"
  }
}
```

**Flow**:
```
Controller → VendorRepository.findById()
```

---

### 5. POST /api/approval/:workflowId

**Purpose**: Approve or reject workflow

**Request Body**:
```json
{
  "action": "approve",
  "reason": "All documents verified",
  "approvedBy": "admin_123"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "approval_123",
    "workflowId": "workflow_123",
    "status": "approved",
    "approvedBy": "admin_123",
    "approvedAt": "2026-07-11T08:00:00.000Z",
    "reason": "All documents verified"
  },
  "metadata": {
    "timestamp": "2026-07-11T08:00:00.000Z"
  }
}
```

**Flow**:
```
Controller → ApprovalRepository.findByWorkflowId()
          → ApprovalTool.execute('approve' or 'reject')
          → ApprovalRepository.update()
```

---

### 6. GET /api/timeline/:workflowId

**Purpose**: Get workflow timeline (audit logs + agent runs)

**Response**:
```json
{
  "success": true,
  "data": {
    "workflowId": "workflow_123",
    "totalEvents": 10,
    "timeline": [
      {
        "type": "audit_log",
        "timestamp": "2026-07-11T08:00:00.000Z",
        "actor": "agent",
        "action": "state_transition",
        "fromState": "START",
        "toState": "WAITING_VENDOR_DETAILS",
        "description": "Workflow transitioned..."
      },
      {
        "type": "agent_run",
        "timestamp": "2026-07-11T08:00:01.000Z",
        "status": "success",
        "reasoning": "Vendor initiated onboarding...",
        "latencyMs": 1250,
        "toolCallsCount": 3
      }
    ]
  },
  "metadata": {
    "timestamp": "2026-07-11T08:00:00.000Z"
  }
}
```

**Flow**:
```
Controller → WorkflowService.getTimeline()
          → AuditLogRepository.getAuditTrail()
          → AgentRunRepository.listByWorkflowId()
          → Combine and sort by timestamp
```

---

### 7. GET /health

**Purpose**: Health check endpoint

**Response**:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2026-07-11T08:00:00.000Z",
    "service": "vendor-onboarding-agent"
  }
}
```

---

## Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "metadata": {
    "timestamp": "ISO-8601 string"
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "details": { ... } // Only in development
  }
}
```

### Error Codes
- `VALIDATION_ERROR` - Invalid request data
- `NOT_FOUND` - Resource not found
- `INTERNAL_ERROR` - Server error
- `SCHEMA_VALIDATION_ERROR` - Zod validation failed

---

## Request Flow

### Complete Flow Through System

```
1. External System (Telegram/WhatsApp/Dashboard)
   ↓
2. HTTP Request → Express App
   ↓
3. Middleware: requestLogger
   ↓
4. Route Handler (/api/workflow/process)
   ↓
5. Controller (workflow.controller.js)
   - Validates request
   - Calls service
   ↓
6. Service (workflow.service.js)
   - Orchestrates runtime/repository calls
   - No business logic
   ↓
7. Workflow Runtime
   ↓
8. Planner Agent
   ↓
9. Tool Executor
   ↓
10. Business Tools
    ↓
11. Repositories
    ↓
12. Database (SQLite/PostgreSQL)
    ↓
13. Response bubbles back up
    ↓
14. Middleware: errorHandler (if error occurred)
    ↓
15. JSON Response to client
```

---

## Middleware Explanation

### 1. requestLogger.js

**Responsibility**: Log all incoming HTTP requests

**Logs**:
- Request received (method, path, query, body)
- Response completed (status, duration)

**Example Log**:
```json
{
  "timestamp": "2026-07-11T08:00:00.000Z",
  "level": "info",
  "service": "API",
  "method": "POST",
  "path": "/api/workflow/process",
  "status": 200,
  "duration": "150ms"
}
```

### 2. errorHandler.js

**Responsibility**: Catch all errors and return consistent JSON

**Features**:
- Determines appropriate HTTP status code
- Maps error types to error codes
- Returns stack trace in development only
- Logs errors with context

**Example**:
```javascript
try {
  // Controller logic
} catch (error) {
  next(error); // errorHandler catches it
}
```

### 3. notFound.js

**Responsibility**: Handle 404 for undefined routes

**Example Response**:
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Route GET /api/invalid not found"
  }
}
```

---

## Services Explanation

### 1. workflow.service.js

**Responsibilities**:
- Invoke WorkflowRuntime for processing
- Fetch workflow details from repositories
- Compose API responses

**Key Methods**:
- `processWorkflow(params)` - Process workflow event
- `processIncomingMessage(message)` - Handle connector message
- `getWorkflowDetails(workflowId)` - Get complete workflow
- `getTimeline(workflowId)` - Get audit trail + agent runs

**No Business Logic**: All logic is in Runtime/Planner/Tools

### 2. connector.service.js

**Responsibilities**:
- Receive normalized connector messages
- Validate required fields
- Delegate to WorkflowService

**Purpose**: Abstraction layer for future connectors

**Connector Normalization**:
```javascript
// Telegram sends message → Normalized format
{
  connectorId: 'telegram',
  workflowId: 'wf_123',
  senderId: 'telegram_user_456',
  text: 'Hello',
  attachments: []
}

// WhatsApp sends message → Same normalized format
{
  connectorId: 'whatsapp',
  workflowId: 'wf_123',
  senderId: 'whatsapp_user_789',
  text: 'Hello',
  attachments: []
}
```

---

## Controllers Explanation

Controllers have **ONE responsibility**: Validate request → Call service → Return JSON

### Pattern

```javascript
async functionName(req, res, next) {
  try {
    // 1. Extract parameters
    const { param } = req.body;
    
    // 2. Validate
    if (!param) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'param required' }
      });
    }
    
    // 3. Call service
    const result = await service.method(param);
    
    // 4. Return success
    res.status(200).json({
      success: true,
      data: result,
      metadata: { timestamp: new Date().toISOString() }
    });
  } catch (error) {
    next(error); // Let errorHandler handle it
  }
}
```

### No Business Logic

Controllers **never** contain:
- ❌ Database queries
- ❌ Business decisions
- ❌ Data transformations
- ❌ Workflow logic

Controllers **only** contain:
- ✅ Request validation
- ✅ Service calls
- ✅ Response formatting

---

## Routes Explanation

Routes map HTTP methods + paths to controller functions.

### Pattern

```javascript
const express = require('express');
const controller = require('../controllers/something.controller');

const router = express.Router();

router.post('/action', (req, res, next) => {
  controller.methodName(req, res, next);
});

module.exports = router;
```

### Registered in app.js

```javascript
app.use('/api/workflow', workflowRoutes);
app.use('/api/connector', connectorRoutes);
app.use('/api/vendor', vendorRoutes);
app.use('/api/approval', approvalRoutes);
app.use('/api/timeline', timelineRoutes);
```

---

## Server Configuration

### app.js - Express Configuration

**Responsibilities**:
- Configure Express app
- Register middleware
- Register routes
- Register error handlers

**Middleware Order** (critical):
```javascript
app.use(cors());              // 1. CORS
app.use(express.json());      // 2. JSON parsing
app.use(requestLogger);       // 3. Request logging
// ... routes ...
app.use(notFound);            // 4. 404 handler
app.use(errorHandler);        // 5. Error handler (MUST BE LAST)
```

### server.js - Server Entry Point

**Responsibilities**:
- Load environment variables
- Initialize Prisma Client
- **Initialize WorkflowRuntime** (CRITICAL)
- Start Express server
- Graceful shutdown (SIGTERM, SIGINT)

**Initialization**:
```javascript
const prisma = getPrismaClient();
workflowRuntime.initialize(); // CRITICAL!
const server = app.listen(PORT);
```

**Graceful Shutdown**:
```javascript
process.on('SIGTERM', async () => {
  server.close(async () => {
    await disconnectPrisma();
    process.exit(0);
  });
});
```

---

## Telegram Connector Integration Point

### Where Telegram Will Plug In

**Endpoint**: `POST /api/connector/message`

**Telegram Connector Responsibilities**:
1. Listen to Telegram Bot API
2. Receive incoming messages
3. Normalize message to standard format
4. POST to `/api/connector/message`
5. Receive response
6. Send response back to Telegram

### Example Telegram Flow

```
Telegram User sends message
↓
Telegram Bot API
↓
Telegram Connector (separate service)
↓
POST /api/connector/message
{
  connectorId: 'telegram',
  workflowId: '<derived from chat_id>',
  channelId: '<telegram chat_id>',
  senderId: '<telegram user_id>',
  senderName: '<telegram username>',
  text: '<message text>',
  attachments: [<if any files>]
}
↓
API processes through runtime
↓
Returns response
↓
Telegram Connector receives response
↓
Sends message back to Telegram Bot API
↓
User sees reply in Telegram
```

---

## Existing Backend Reuse

### ZERO Modifications to Core Logic

**Not Modified**:
- ✅ Planner Agent (`src/agent/planner.js`)
- ✅ Workflow Runtime (`src/runtime/workflowRuntime.js`)
- ✅ Tool Executor (`src/executor/toolExecutor.js`)
- ✅ Business Tools (all 7 tools)
- ✅ Repositories (all 7 repositories)
- ✅ Database schema

**Only Modified**:
- ✅ `server.js` - Added `workflowRuntime.initialize()` call

**Result**: API layer is a **pure integration layer** with zero architectural changes.

---

## Testing

### Start Server

```bash
npm start
# Server starts on http://localhost:3000
```

### Run API Tests

```bash
node test-api.js
```

### Test Coverage

1. ✅ Health check
2. ✅ POST /api/workflow/process
3. ✅ GET /api/workflow/:id
4. ✅ POST /api/connector/message
5. ✅ GET /api/vendor/:id
6. ✅ GET /api/timeline/:workflowId
7. ✅ POST /api/approval/:workflowId
8. ✅ 404 handler

---

## Future Integration

### Dashboard (Next.js)

**Will Use**:
- `GET /api/workflow/:id` - Display workflow details
- `GET /api/timeline/:workflowId` - Show timeline
- `POST /api/approval/:workflowId` - Approve/reject button
- `GET /api/vendor/:id` - Display vendor info

### ERP Integration

**Will Use**:
- `GET /api/workflow/:id` - Sync workflow state
- `GET /api/vendor/:id` - Sync vendor data
- Webhook to `POST /api/workflow/process` - Trigger from ERP

### WhatsApp Connector

**Will Use**:
- `POST /api/connector/message` - Send normalized messages

---

## Summary

### What Was Built

- ✅ 3 middleware files
- ✅ 2 service files
- ✅ 5 controller files
- ✅ 5 route files
- ✅ Express app configuration
- ✅ Server with graceful shutdown
- ✅ Comprehensive test script

### Architecture Achieved

```
Clean separation of concerns:
- Routes: Define HTTP endpoints
- Controllers: Validate & respond
- Services: Orchestrate
- Runtime/Tools/Repositories: Business logic (unchanged)
```

### Integration Ready

The API layer is ready for:
- Telegram Connector
- WhatsApp Connector
- Dashboard (Next.js)
- ERP Integration

All external systems will communicate through REST APIs only.
No external system will import backend modules directly.

**Result**: Clean, maintainable, scalable API architecture.
