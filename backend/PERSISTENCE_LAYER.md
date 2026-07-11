# Persistence Layer Documentation

## Overview

The persistence layer replaces in-memory storage with **SQLite database** using **Prisma ORM**. All business tools now persist data, and the system tracks every planner invocation and workflow transition for complete observability.

---

## Database Architecture

### Technology Stack
- **ORM**: Prisma 5.22.0
- **Database**: SQLite (development)
- **Migration Tool**: Prisma Migrate
- **Database File**: `backend/dev.db`

### Why SQLite?
- Zero configuration
- Fast for development
- Easy to switch to PostgreSQL in production
- Single file database - no server required

---

## Database Schema

### Models

#### 1. **Vendor**
Stores vendor company information.

```prisma
model Vendor {
  id            String    @id @default(uuid())
  companyName   String?
  contactPerson String?
  email         String?
  phone         String?
  gstNumber     String?
  panNumber     String?
  bankAccount   String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  workflows     Workflow[]
}
```

#### 2. **Workflow**
Tracks onboarding workflow state and history.

```prisma
model Workflow {
  id            String    @id @default(uuid())
  vendorId      String?
  currentState  String
  previousState String?
  channel       String?   // telegram, web, api
  stateHistory  String    @default("[]") // JSON array
  metadata      String?   // JSON metadata
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}
```

**Key Features**:
- Tracks current and previous state
- Maintains full state history as JSON array
- Links to vendor, messages, documents, approvals

#### 3. **Message**
Conversation history between vendor and agent.

```prisma
model Message {
  id          String    @id @default(uuid())
  workflowId  String
  content     String
  sender      String    // vendor, agent, system
  messageType String    @default("text")
  metadata    String?
  createdAt   DateTime  @default(now())
}
```

#### 4. **Document**
Uploaded documents (GST, PAN, Bank Proof).

```prisma
model Document {
  id           String    @id @default(uuid())
  workflowId   String
  documentType String    // gst_certificate, pan_card, bank_proof
  fileName     String?
  fileUrl      String?
  status       String    @default("pending")
  verifiedAt   DateTime?
  uploadedAt   DateTime  @default(now())
  metadata     String?
}
```

#### 5. **Approval**
Finance approval workflow.

```prisma
model Approval {
  id          String    @id @default(uuid())
  workflowId  String
  vendorId    String?
  status      String    @default("pending")
  requestedBy String?
  approvedBy  String?
  rejectedBy  String?
  reason      String?
  requestedAt DateTime  @default(now())
  approvedAt  DateTime?
  rejectedAt  DateTime?
  metadata    String?
}
```

#### 6. **AgentRun** 
Tracks every planner invocation for observability.

```prisma
model AgentRun {
  id              String    @id @default(uuid())
  workflowId      String
  plannerInput    String    // JSON of PlannerRequest
  plannerOutput   String?   // JSON of PlannerResponse
  reasoning       String?
  decision        String?   // JSON of decision
  toolCallsCount  Int       @default(0)
  status          String    // success, error, timeout
  errorMessage    String?
  latencyMs       Int?
  promptVersion   String    @default("v1")
  modelName       String    @default("llama-3.3-70b-versatile")
  createdAt       DateTime  @default(now())
  completedAt     DateTime?
}
```

**Purpose**: Full observability of AI decisions, performance metrics, and debugging.

#### 7. **AuditLog**
Complete audit trail of all workflow actions.

```prisma
model AuditLog {
  id          String    @id @default(uuid())
  workflowId  String
  actor       String    // agent, user, system
  action      String    // state_transition, document_upload, etc.
  fromState   String?
  toState     String?
  description String?
  metadata    String?
  timestamp   DateTime  @default(now())
}
```

**Purpose**: Compliance, debugging, and workflow analytics.

---

## Repositories

All repositories follow the same pattern:
- **No business logic** - only data access
- **Async/await** - all methods return Promises
- **JSON parsing** - handle JSON fields automatically
- **Error propagation** - let errors bubble up

### Repository Files

#### 1. **vendorRepository.js**
```javascript
- create(data)      // Create vendor
- findById(id)      // Find by ID
- update(id, data)  // Update vendor
- upsert(id, data)  // Create or update
- list(options)     // List all
- deleteById(id)    // Delete
```

#### 2. **workflowRepository.js**
```javascript
- create(data)           // Create workflow
- findById(id)           // Find with relations
- updateState(id, data)  // Update state + history
- update(id, data)       // General update
- list(options)          // List workflows
- findByVendorId(id)     // Find by vendor
- deleteById(id)         // Delete
```

#### 3. **messageRepository.js**
```javascript
- create(data)                    // Create message
- findById(id)                    // Find by ID
- listByWorkflowId(wfId, options) // List for workflow
- getRecent(wfId, limit)          // Get recent messages
- deleteById(id)                  // Delete
- deleteByWorkflowId(wfId)        // Delete all
```

#### 4. **documentRepository.js**
```javascript
- create(data)                    // Create document
- findById(id)                    // Find by ID
- listByWorkflowId(wfId, options) // List for workflow
- update(id, data)                // Update document
- findByType(wfId, type)          // Find by type
- deleteById(id)                  // Delete
- deleteByWorkflowId(wfId)        // Delete all
```

#### 5. **approvalRepository.js**
```javascript
- create(data)              // Create approval
- findById(id)              // Find by ID
- findByWorkflowId(wfId)    // Find by workflow
- update(id, data)          // Update approval
- list(options)             // List all
- listPending()             // List pending
- deleteById(id)            // Delete
```

#### 6. **agentRunRepository.js**
```javascript
- create(data)                  // Create run
- findById(id)                  // Find by ID
- complete(id, data)            // Update with results
- listByWorkflowId(wfId, opts)  // List for workflow
- getStats(wfId)                // Get statistics
- deleteById(id)                // Delete
```

#### 7. **auditLogRepository.js**
```javascript
- create(data)                  // Create log entry
- findById(id)                  // Find by ID
- listByWorkflowId(wfId, opts)  // List for workflow
- listByAction(action, opts)    // List by action type
- getAuditTrail(wfId)           // Complete trail
- deleteById(id)                // Delete
- deleteByWorkflowId(wfId)      // Delete all
```

---

## Modified Business Tools

All tools now use repositories instead of in-memory Maps.

### Changes Made

#### **vendorTool.js**
**Before**: `this.vendors = new Map()`  
**After**: Uses `vendorRepository`

**Changes**:
- `createVendor()` → `vendorRepository.create()`
- `getVendor()` → `vendorRepository.findById()`
- `updateVendor()` → `vendorRepository.upsert()`

#### **workflowTool.js**
**Before**: `this.workflows = new Map()`  
**After**: Uses `workflowRepository` + `auditLogRepository`

**Changes**:
- `getState()` → `workflowRepository.findById()` or `create()`
- `updateState()` → `workflowRepository.updateState()` + **audit log created**
- `validateState()` → `workflowRepository.findById()`

**Critical**: State transitions now **automatically create audit logs**.

#### **documentTool.js**
**Before**: `this.documents = new Map()`  
**After**: Uses `documentRepository`

**Changes**:
- `saveDocument()` → `documentRepository.create()`
- `listDocuments()` → `documentRepository.listByWorkflowId()`
- `verifyDocument()` → `documentRepository.update()`
- `missingDocuments()` → fetch and compare

#### **conversationTool.js**
**Before**: `this.conversations = new Map()`  
**After**: Uses `messageRepository`

**Changes**:
- `saveMessage()` → `messageRepository.create()`
- `history()` → `messageRepository.listByWorkflowId()`

#### **approvalTool.js**
**Before**: `this.approvals = new Map()`  
**After**: Uses `approvalRepository`

**Changes**:
- `requestApproval()` → `approvalRepository.create()`
- `approve()` → `approvalRepository.update()`
- `reject()` → `approvalRepository.update()`
- `getStatus()` → `approvalRepository.findById()` or `findByWorkflowId()`

#### **loggerTool.js**
**Before**: `this.timelines = new Map()`  
**After**: Uses `auditLogRepository`

**Changes**:
- `log()` → `auditLogRepository.create()` + console log
- `timeline()` → `auditLogRepository.listByWorkflowId()`

---

## AgentRun Persistence

### Integration Point: **plannerInvoker.js**

Every planner invocation now:

1. **Before invocation**: Create `AgentRun` with status `pending`
2. **After success**: Update with output, reasoning, latency
3. **After failure**: Update with error message, latency

### Implementation

```javascript
// Create AgentRun before invocation
const agentRun = await agentRunRepository.create({
  workflowId: plannerRequest.workflowContext.workflowId,
  plannerInput: plannerRequest,
  status: 'pending',
  promptVersion: 'v1'
});

// On success
await agentRunRepository.complete(agentRun.id, {
  plannerOutput: result,
  reasoning: result.reasoning,
  decision: result.decision,
  toolCallsCount: result.toolCalls?.length || 0,
  status: 'success',
  latencyMs
});

// On error
await agentRunRepository.complete(agentRun.id, {
  status: 'error',
  errorMessage: error.message,
  latencyMs
});
```

### Benefits
- Full observability of AI decisions
- Performance tracking
- Debugging failed invocations
- Prompt version tracking
- Model performance analysis

---

## AuditLog Persistence

### Automatic Creation

Audit logs are created automatically in two places:

#### 1. **State Transitions** (workflowTool.js)
```javascript
await auditLogRepository.create({
  workflowId,
  actor: 'agent',
  action: 'state_transition',
  fromState: previousState,
  toState: newState,
  description: `Workflow transitioned from ${previousState} to ${newState}`
});
```

#### 2. **Event Logging** (loggerTool.js)
```javascript
await auditLogRepository.create({
  workflowId,
  actor: 'agent',
  action: event,
  description: description,
  metadata: metadata
});
```

### Use Cases
- Compliance requirements
- Debugging workflow issues
- Performance analytics
- User behavior analysis

---

## Database Configuration

### File: `src/config/db.js`

```javascript
const { PrismaClient } = require('@prisma/client');

let prisma;

function getPrismaClient() {
  if (!prisma) {
    prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' 
        ? ['query', 'error', 'warn'] 
        : ['error']
    });
  }
  return prisma;
}

async function disconnectPrisma() {
  if (prisma) {
    await prisma.$disconnect();
  }
}

module.exports = { getPrismaClient, disconnectPrisma, prisma: getPrismaClient() };
```

**Singleton pattern** ensures only one Prisma Client instance exists.

---

## Database Migrations

### Initial Migration

```bash
npx prisma migrate dev --name init
```

This creates:
- `prisma/migrations/` folder
- `dev.db` SQLite file
- Prisma Client in `node_modules/@prisma/client`

### Future Migrations

When schema changes:
```bash
npx prisma migrate dev --name describe_your_change
```

### Reset Database (Development Only)

```bash
npx prisma migrate reset
```

---

## Switching to PostgreSQL

To switch from SQLite to PostgreSQL for production:

### 1. Update `prisma/schema.prisma`

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### 2. Update `.env`

```
DATABASE_URL=postgresql://user:password@localhost:5432/vendor_onboarding
```

### 3. Run Migration

```bash
npx prisma migrate dev --name switch_to_postgresql
```

**No code changes required** - Prisma abstracts the database.

---

## Testing

### Test Script: `test-persistence.js`

Demonstrates:
1. Vendor creation
2. Workflow creation
3. Message saving
4. Document upload
5. State transitions with audit logs
6. Approval requests
7. Event logging
8. AgentRun creation
9. Complete workflow retrieval
10. Audit trail retrieval
11. Conversation history
12. Document listing
13. Missing documents check
14. AgentRun statistics

### Run Tests

```bash
node test-persistence.js
```

---

## Integration with Workflow Runtime

### Minimal Changes

The workflow runtime was **NOT redesigned**. Only these changes were made:

#### plannerInvoker.js
- Added `agentRunRepository` import
- Wrap planner invocation with AgentRun persistence
- Track latency and errors

#### Business Tools (6 files)
- Replaced `Map` storage with repository calls
- Kept exact same public interfaces
- No changes to tool signatures

### Result

The system now has:
- ✅ Full persistence
- ✅ Complete audit trail
- ✅ AI observability
- ✅ No architectural changes
- ✅ Same tool interfaces

---

## Prisma Studio

Prisma includes a GUI for database inspection.

### Launch Prisma Studio

```bash
npx prisma studio
```

Opens browser at `http://localhost:5555` with:
- Visual table browser
- Data editing
- Relationship navigation
- Query builder

---

## Performance Considerations

### Indexes

Schema includes indexes on:
- `workflowId` (all related tables)
- `status` (approvals, agent_runs)
- `timestamp` (audit_logs)
- `action` (audit_logs)

### JSON Fields

State history and metadata stored as JSON strings:
- Flexible schema
- No additional tables needed
- Automatically parsed in repositories

### Connection Pooling

For production PostgreSQL, configure:
```
DATABASE_URL=postgresql://user:pass@host:5432/db?connection_limit=10&pool_timeout=20
```

---

## Summary

### What Changed
- **7 repositories** created for data access
- **6 business tools** now use repositories
- **plannerInvoker** tracks AgentRuns
- **workflowTool** creates audit logs on state transitions
- **SQLite database** with Prisma ORM

### What Stayed the Same
- Tool public interfaces unchanged
- Workflow runtime architecture intact
- No changes to planner logic
- Test suite still works

### Benefits
- ✅ Data persists across restarts
- ✅ Full audit trail
- ✅ AI observability
- ✅ Performance metrics
- ✅ Easy PostgreSQL migration
- ✅ Zero architectural redesign
