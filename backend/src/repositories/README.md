# Repositories

Data access layer for the Vendor Onboarding Agent. All database operations go through repositories.

## Architecture Principle

**Repositories contain ONLY database operations. Zero business logic.**

## Pattern

Every repository follows this structure:

```javascript
const { prisma } = require('../config/db');

// CRUD operations only
async function create(data) { ... }
async function findById(id) { ... }
async function update(id, data) { ... }
async function list(options) { ... }
async function deleteById(id) { ... }

module.exports = { create, findById, update, list, deleteById };
```

## Repositories

### vendorRepository.js
Manages vendor company data.

**Methods**:
- `create(data)` - Create vendor
- `findById(id)` - Get vendor by ID
- `update(id, data)` - Update vendor
- `upsert(id, data)` - Create or update
- `list(options)` - List vendors
- `deleteById(id)` - Delete vendor

### workflowRepository.js
Manages workflow state and history.

**Methods**:
- `create(data)` - Create workflow
- `findById(id)` - Get workflow with relations (vendor, messages, documents)
- `updateState(id, data)` - Update state and append to history
- `update(id, data)` - General update
- `list(options)` - List workflows
- `findByVendorId(vendorId)` - Get workflow by vendor
- `deleteById(id)` - Delete workflow

**Special Features**:
- Automatically parses JSON fields (stateHistory, metadata)
- Includes relations when fetching

### messageRepository.js
Manages conversation messages.

**Methods**:
- `create(data)` - Save message
- `findById(id)` - Get message
- `listByWorkflowId(workflowId, options)` - Get messages for workflow
- `getRecent(workflowId, limit)` - Get recent N messages
- `deleteById(id)` - Delete message
- `deleteByWorkflowId(workflowId)` - Delete all messages

### documentRepository.js
Manages uploaded documents.

**Methods**:
- `create(data)` - Save document
- `findById(id)` - Get document
- `listByWorkflowId(workflowId, options)` - List documents for workflow
- `update(id, data)` - Update document (status, verifiedAt)
- `findByType(workflowId, documentType)` - Find specific document type
- `deleteById(id)` - Delete document
- `deleteByWorkflowId(workflowId)` - Delete all documents

### approvalRepository.js
Manages approval workflow.

**Methods**:
- `create(data)` - Create approval request
- `findById(id)` - Get approval
- `findByWorkflowId(workflowId)` - Get approval for workflow
- `update(id, data)` - Update approval status
- `list(options)` - List approvals (with workflow + vendor relations)
- `listPending()` - Get pending approvals
- `deleteById(id)` - Delete approval

### agentRunRepository.js
Tracks every planner invocation.

**Methods**:
- `create(data)` - Create agent run record
- `findById(id)` - Get agent run
- `complete(id, data)` - Update with completion data
- `listByWorkflowId(workflowId, options)` - List runs for workflow
- `getStats(workflowId)` - Get performance statistics
- `deleteById(id)` - Delete agent run

**Statistics Returned**:
- Total runs
- Average latency
- Min/max latency
- Status breakdown (success/error/timeout)

### auditLogRepository.js
Maintains complete audit trail.

**Methods**:
- `create(data)` - Create audit log entry
- `findById(id)` - Get log entry
- `listByWorkflowId(workflowId, options)` - List logs for workflow
- `listByAction(action, options)` - List by action type
- `getAuditTrail(workflowId)` - Get complete trail
- `deleteById(id)` - Delete log
- `deleteByWorkflowId(workflowId)` - Delete all logs

## JSON Field Handling

Repositories automatically handle JSON serialization:

```javascript
// Input: JavaScript object
{ stateHistory: ['START', 'WAITING_GST'] }

// Stored: JSON string
'["START","WAITING_GST"]'

// Output: Parsed back to object
{ stateHistory: ['START', 'WAITING_GST'] }
```

## Usage Example

```javascript
const workflowRepository = require('./repositories/workflowRepository');

// Create workflow
const workflow = await workflowRepository.create({
  workflowId: 'wf_123',
  currentState: 'START',
  stateHistory: ['START']
});

// Update state
await workflowRepository.updateState('wf_123', {
  currentState: 'WAITING_GST',
  previousState: 'START'
});

// Retrieve with relations
const complete = await workflowRepository.findById('wf_123');
// Returns workflow + vendor + messages + documents
```

## Error Handling

Repositories propagate Prisma errors:

```javascript
try {
  await vendorRepository.create({ vendorId: 'v1' });
} catch (error) {
  // Unique constraint violation
  // Foreign key violation
  // Not found
}
```

Let business logic handle errors appropriately.

## Testing

Use `test-persistence.js` to verify repository operations:

```bash
node test-persistence.js
```
