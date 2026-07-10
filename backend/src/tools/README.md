# Business Tools - Phase 3

Business tools that execute workflow actions.

## Architecture

```
ToolExecutor
    ↓
ToolRegistry.get(toolName)
    ↓
BusinessTool.execute(action, args)
    ↓
Tool-specific method (e.g., updateVendor)
    ↓
Return result
```

## Tool Interface

Every tool MUST implement:

```javascript
class Tool {
  async execute(action, args) {
    switch (action) {
      case 'action_name':
        return await this.actionMethod(args);
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }
}
```

## Registered Tools

### 1. **workflowTool** - Workflow State Management
**Actions:**
- `get_state` - Get current workflow state
- `update_state` - Update workflow state
- `validate_state` - Validate expected state

**Example:**
```javascript
await workflowTool.execute('update_state', {
  workflowId: 'wf_123',
  fromState: 'WAITING_GST',
  toState: 'WAITING_PAN'
});
```

---

### 2. **vendorTool** - Vendor Data Management
**Actions:**
- `create` - Create new vendor
- `get` - Get vendor by ID
- `update` - Update vendor information

**Example:**
```javascript
await vendorTool.execute('update', {
  vendorId: 'v_123',
  vendorData: {
    companyName: 'Acme Corp',
    gstNumber: '27AABCU9603R1ZM'
  }
});
```

---

### 3. **documentTool** - Document Management
**Actions:**
- `save` - Save uploaded document
- `list` - List all documents
- `validate` - Verify/validate document
- `get_missing` - Get missing documents

**Example:**
```javascript
await documentTool.execute('save', {
  workflowId: 'wf_123',
  documentType: 'gst_certificate',
  fileUrl: 'https://...',
  fileName: 'gst.pdf'
});
```

---

### 4. **conversationTool** - Message Management
**Actions:**
- `save_message` - Save message to history
- `get_history` - Get conversation history

**Example:**
```javascript
await conversationTool.execute('save_message', {
  workflowId: 'wf_123',
  message: 'Please upload your GST certificate',
  sender: 'system'
});
```

---

### 5. **approvalTool** - Approval Workflow
**Actions:**
- `create_request` - Create approval request
- `approve` - Approve vendor
- `reject` - Reject vendor
- `get_status` - Get approval status

**Example:**
```javascript
await approvalTool.execute('create_request', {
  workflowId: 'wf_123',
  vendorId: 'v_123',
  requestedBy: 'system'
});
```

---

### 6. **notificationTool** - Notification Preparation
**Actions:**
- `prepare_message` - Prepare notification
- `send` - Queue notification (placeholder)

**Note:** Does NOT actually send messages (no connector yet)

**Example:**
```javascript
await notificationTool.execute('prepare_message', {
  recipientId: 'v_123',
  message: 'Your application is approved',
  messageType: 'text'
});
```

---

### 7. **loggerTool** - Event Logging
**Actions:**
- `log_event` - Log workflow event
- `get_timeline` - Get event timeline

**Example:**
```javascript
await loggerTool.execute('log_event', {
  workflowId: 'wf_123',
  event: 'gst_uploaded',
  description: 'Vendor uploaded GST certificate'
});
```

---

## Adding New Tools

### Step 1: Create Tool File

```javascript
// src/tools/myNewTool.js
class MyNewTool {
  async execute(action, args) {
    switch (action) {
      case 'do_something':
        return await this.doSomething(args);
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  async doSomething(args) {
    // Implementation
    return {
      success: true,
      data: {}
    };
  }
}

module.exports = new MyNewTool();
```

### Step 2: Register Tool

```javascript
// src/executor/initializeTools.js
const myNewTool = require('../tools/myNewTool');

function initializeTools() {
  // ... existing registrations
  toolRegistry.register('mynew', myNewTool);
}
```

### Step 3: Use in Planner

The Planner can now request this tool:

```json
{
  "toolCalls": [
    {
      "tool": "mynew",
      "action": "do_something",
      "parameters": {}
    }
  ]
}
```

---

## Current Implementation

### Storage
- **In-memory** (mocked data)
- Each tool maintains its own Map/storage
- Data is lost on restart

### Phase 4 Changes
Will replace with:
- Repository pattern
- PostgreSQL database
- Prisma ORM
- Persistent storage

**No tool interface changes needed!**

---

## Error Handling

Tools return structured results:

```javascript
// Success
{
  success: true,
  data: {...}
}

// Failure
{
  success: false,
  error: 'Error message'
}
```

Executor catches exceptions and continues unless fatal.

---

## Testing Tools

```javascript
const vendorTool = require('./vendorTool');

const result = await vendorTool.execute('create', {
  vendorId: 'v_test',
  vendorData: { companyName: 'Test Corp' }
});

console.log(result.success); // true
console.log(result.data); // { vendorId, companyName, ... }
```

---

**Status:** ✅ Phase 3 Complete  
**Storage:** In-memory (mock)  
**Next Phase:** Repository + Database Integration
