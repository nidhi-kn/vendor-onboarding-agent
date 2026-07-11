# Phase 6: Connector Layer - Complete Explanation

## 🎯 Objective Achieved

Built a **transport abstraction layer** that allows external systems (Telegram, WhatsApp, ERP) to communicate with the backend **exclusively through HTTP POST /api/connector/message**. Connectors are completely independent—they NEVER import backend modules.

---

## 📁 Every Connector Explained

### 1. **connector.interface.js** - Abstract Base Class

**Purpose**: Defines the contract all connectors must follow.

**Required Methods**:
- `connect()` - Connect to external system
- `disconnect()` - Disconnect cleanly
- `sendMessage(channelId, message)` - Send text message
- `sendFile(channelId, fileUrl, caption)` - Send file
- `normalizeInbound(externalMessage)` - Convert to standard format
- `healthCheck()` - Return health status
- `getMetrics()` - Return performance metrics

**Built-in Features**:
- Metrics tracking (received, sent, failed, uptime)
- Heartbeat tracking
- Connection status
- Metric increment methods

**Key**: All methods throw "Not Implemented" in base class, forcing implementations.

---

### 2. **connectorRegistry.js** - Connector Manager

**Purpose**: Centralized registry for managing connector instances.

**Key Methods**:
- `register(connectorId, connector)` - Register connector (prevents duplicates)
- `get(connectorId)` - Retrieve by ID
- `list()` - List all IDs
- `has(connectorId)` - Check existence
- `getHealthStatus()` - Get health of all connectors

**Features**:
- **Singleton** - One registry for entire application
- **Duplicate prevention** - Warns if connector already registered
- **Logging** - Logs all register/unregister operations
- **Health aggregation** - Can check health of all connectors at once

**Example**:
```javascript
const telegram = new TelegramConnector();
connectorRegistry.register('telegram', telegram);

const connector = connectorRegistry.get('telegram');
await connector.connect();
```

---

### 3. **connectorMetrics.js** - Metrics Collector

**Purpose**: Centralized metrics tracking for all connectors.

**Tracks**:
- `messagesReceived` - Total messages received
- `messagesSent` - Total messages sent
- `failedMessages` - Total failures
- `uptime` - Connector uptime
- `lastHeartbeat` - Last heartbeat timestamp
- `connected` - Connection status

**Key Methods**:
- `register(connectorId)` - Start tracking
- `recordReceived(connectorId)` - Increment received
- `recordSent(connectorId)` - Increment sent
- `recordFailed(connectorId)` - Increment failed
- `heartbeat(connectorId)` - Update heartbeat
- `updateStatus(connectorId, connected)` - Update connection state
- `getMetrics(connectorId)` - Get metrics for one
- `getAllMetrics()` - Get all metrics

**Why Separate?**: Allows global metrics collection without coupling to individual connectors.

---

### 4. **telegramConnector.js** - Telegram Implementation

**Purpose**: Connect Telegram bots to the backend via HTTP.

**Architecture**:
```
Telegram User
↓
Telegram Bot API (long polling)
↓
TelegramConnector.handleIncomingMessage()
↓
normalizeInbound() - Remove Telegram specifics
↓
sendToBackend() with retry
↓
HTTP POST http://localhost:3000/api/connector/message
↓
Backend processes
↓
HTTP Response
↓
sendMessage() to Telegram
↓
User receives reply
```

**Key Features**:

**1. Long Polling**:
```javascript
this.bot = new TelegramBot(this.botToken, { polling: true });
this.bot.on('message', (msg) => this.handleIncomingMessage(msg));
```

**2. Message Normalization**:
```javascript
// Telegram message (has Telegram-specific fields)
{
  message_id: 123,
  chat: { id: 456789 },
  from: { id: 987654, username: 'testuser' },
  text: 'Hello'
}

// Normalized (generic, no Telegram fields)
{
  connectorId: 'telegram',
  workflowId: 'workflow_telegram_456789',
  channelId: '456789',
  senderId: '987654',
  senderName: 'testuser',
  text: 'Hello',
  attachments: [],
  receivedAt: '2026-07-11T08:00:00.000Z'
}
```

**3. Retry with Exponential Backoff**:
```javascript
for (let attempt = 0; attempt < 3; attempt++) {
  try {
    const response = await axios.post(url, message);
    return response.data;
  } catch (error) {
    if (attempt < 2) {
      await sleep(delays[attempt]); // 500ms, 1000ms, 2000ms
    }
  }
}
```

**4. Error Handling**:
- If backend fails after all retries, send error message to user
- Log error for monitoring
- Increment `failedMessages` metric

**5. Attachment Extraction**:
- Extracts documents (with fileId, fileName, mimeType)
- Extracts photos (largest size)
- Converts to generic attachment format

**6. Health Check**:
```javascript
async healthCheck() {
  const me = await this.bot.getMe();
  return {
    healthy: true,
    botInfo: {
      id: me.id,
      username: me.username
    }
  };
}
```

**Environment Variables**:
```bash
TELEGRAM_BOT_TOKEN=your_bot_token
API_BASE_URL=http://localhost:3000
```

**What Telegram Connector NEVER Does**:
❌ Import WorkflowRuntime  
❌ Import Planner  
❌ Import Tools  
❌ Import Repositories  
❌ Make business decisions  
❌ Execute tools  
❌ Access database  

**Only HTTP communication!**

---

### 5. **mockErpConnector.js** - ERP Simulation

**Purpose**: Demonstrate ERP integration pattern without real HTTP.

**Simulated Operations**:

**1. Create Vendor**:
```javascript
const vendor = await erp.createVendor({
  companyName: 'Test Corp',
  email: 'test@example.com',
  gstNumber: 'GST123'
});
// Returns: { erpVendorId: 'ERP-V-123', status: 'active', ... }
```

**2. Sync Vendor**:
```javascript
const result = await erp.syncVendor('ERP-V-123', {
  companyName: 'Test Corp Updated',
  phone: '+91-9999999999'
});
// Returns: { success: true, syncedAt: '...' }
```

**3. Get Vendor Status**:
```javascript
const status = await erp.getVendorStatus('ERP-V-123');
// Returns: { success: true, vendor: {...} }
```

**4. Get Sync Log**:
```javascript
const log = erp.getSyncLog();
// Returns: [{ operation: 'create_vendor', vendorId: '...', timestamp: '...' }]
```

**Mock Data Store**:
- Uses in-memory `Map` for vendors
- Uses array for sync log
- Simulates 100ms connection delay

**Why Mock?**: Shows ERP pattern without requiring real ERP setup.

**Real ERP Connector Would**:
- Replace `Map` with actual HTTP calls to ERP API
- Implement authentication (API keys, OAuth)
- Handle ERP-specific error codes
- Map ERP responses to our format

---

## 🔧 Connector Interface Deep Dive

### Contract Enforcement

The abstract class ensures all connectors implement required methods:

```javascript
class MyConnector extends Connector {
  // MUST implement or error thrown:
  async connect() { ... }
  async disconnect() { ... }
  async sendMessage(channelId, message) { ... }
  async sendFile(channelId, fileUrl, caption) { ... }
  normalizeInbound(externalMessage) { ... }
  async healthCheck() { ... }
}
```

### Metrics Built-in

Every connector automatically tracks:

```javascript
const metrics = connector.getMetrics();
// {
//   connectorId: 'telegram',
//   connected: true,
//   messagesReceived: 150,
//   messagesSent: 145,
//   failedMessages: 5,
//   uptimeSeconds: 3600,
//   lastHeartbeat: '2026-07-11T08:00:00.000Z'
// }
```

**Usage in Connector**:
```javascript
this.incrementReceived();  // After receiving message
this.incrementSent();      // After sending message
this.incrementFailed();    // After failure
this.heartbeat();          // Periodically
```

---

## 📊 Registry Explained

### Purpose

Central registry prevents:
- Duplicate connectors with same ID
- Lost connector references
- Unmanaged connectors

### Features

**1. Duplicate Prevention**:
```javascript
connectorRegistry.register('telegram', connector1);  // OK
connectorRegistry.register('telegram', connector2);  // WARNS, returns false
```

**2. Centralized Access**:
```javascript
const telegram = connectorRegistry.get('telegram');
await telegram.sendMessage('123', 'Hello');
```

**3. Health Aggregation**:
```javascript
const healthStatuses = await connectorRegistry.getHealthStatus();
// [
//   { connectorId: 'telegram', healthy: true, botInfo: {...} },
//   { connectorId: 'whatsapp', healthy: true, ... }
// ]
```

**4. List All**:
```javascript
const list = connectorRegistry.list();
// ['telegram', 'whatsapp', 'mock-erp']
```

---

## 📈 Metrics Explained

### Why Separate Metrics Module?

**Without Separate Metrics**:
- Each connector tracks own metrics
- Hard to aggregate across connectors
- Hard to monitor globally

**With Separate Metrics**:
- Centralized collection
- Easy aggregation
- Global monitoring
- Connector-independent

### Usage Pattern

```javascript
// In connector
connectorMetrics.register('telegram');
connectorMetrics.recordReceived('telegram');
connectorMetrics.recordSent('telegram');

// In monitoring service
const metrics = connectorMetrics.getAllMetrics();
metrics.forEach(m => {
  console.log(`${m.connectorId}: ${m.messagesReceived} received`);
});
```

### Monitoring Queries

```javascript
// Total messages across all connectors
const total = connectorMetrics.getAllMetrics()
  .reduce((sum, m) => sum + m.messagesReceived, 0);

// Connectors with failures
const failing = connectorMetrics.getAllMetrics()
  .filter(m => m.failedMessages > 10);

// Disconnected connectors
const disconnected = connectorMetrics.getAllMetrics()
  .filter(m => !m.connected);
```

---

## 🔄 Retry Strategy Explained

### Configuration

```javascript
{
  maxRetries: 3,
  delays: [500, 1000, 2000]  // Exponential backoff in milliseconds
}
```

### Execution Timeline

| Time    | Attempt | Action                       | Cumulative Wait |
|---------|---------|------------------------------|-----------------|
| 0ms     | 1       | First try                    | 0ms             |
| Failed  | -       | Wait 500ms                   | 500ms           |
| 500ms   | 2       | Second try                   | 500ms           |
| Failed  | -       | Wait 1000ms                  | 1500ms          |
| 1500ms  | 3       | Third try                    | 1500ms          |
| Failed  | -       | Give up (total 3500ms spent) | 3500ms          |

### Why Exponential Backoff?

**Without Backoff** (constant 500ms):
- Hammers backend during outage
- Doesn't give backend time to recover
- Wastes resources

**With Exponential Backoff**:
- Initial quick retry (500ms) - catches transient errors
- Longer delays (1000ms, 2000ms) - gives backend time to recover
- Industry standard pattern

### Failure Handling

After all retries exhausted:

```javascript
// 1. Log error
console.error({
  service: 'TelegramConnector',
  error: error.message,
  workflowId,
  attempts: 3
});

// 2. Update metrics
this.incrementFailed();
connectorMetrics.recordFailed('telegram');

// 3. Inform user
await this.bot.sendMessage(
  chatId,
  'Sorry, I encountered an error. Please try again.'
);

// 4. Throw for monitoring systems
throw new Error('Backend unavailable after 3 attempts');
```

---

## 🌐 How Telegram Communicates with Backend

### Complete Flow

**Step 1: User Sends Message**
```
User types in Telegram: "Hi, I want to register"
```

**Step 2: Telegram Delivers to Bot**
```javascript
{
  message_id: 123,
  chat: { id: 456789, type: 'private' },
  from: { id: 987654, username: 'john', first_name: 'John' },
  text: 'Hi, I want to register',
  date: 1783760000
}
```

**Step 3: Connector Receives**
```javascript
this.bot.on('message', (msg) => {
  this.handleIncomingMessage(msg);
});
```

**Step 4: Normalize Message**
```javascript
const normalized = this.normalizeInbound(msg);
// {
//   connectorId: 'telegram',
//   workflowId: 'workflow_telegram_456789',
//   channelId: '456789',
//   senderId: '987654',
//   senderName: 'john',
//   text: 'Hi, I want to register',
//   attachments: [],
//   receivedAt: '2026-07-11T08:00:00.000Z'
// }
```

**Step 5: POST to Backend (with retry)**
```http
POST http://localhost:3000/api/connector/message
Content-Type: application/json

{
  "connectorId": "telegram",
  "workflowId": "workflow_telegram_456789",
  "channelId": "456789",
  "senderId": "987654",
  "senderName": "john",
  "text": "Hi, I want to register",
  "attachments": [],
  "receivedAt": "2026-07-11T08:00:00.000Z"
}
```

**Step 6: Backend Processes**
```
API Layer (connector.controller.js)
↓
Service Layer (connector.service.js)
↓
Workflow Service (workflow.service.js)
↓
Workflow Runtime
↓
Planner Agent (makes decision)
↓
Tool Executor (saves message, updates state)
↓
Database (persists everything)
↓
Response bubbles back up
```

**Step 7: Backend Returns**
```json
{
  "success": true,
  "data": {
    "connectorId": "telegram",
    "workflowId": "workflow_telegram_456789",
    "processed": true,
    "result": {
      "workflowState": "WAITING_VENDOR_DETAILS",
      "responseMessage": "Welcome! To register as a vendor, please provide:\n1. Company Name\n2. Contact Person\n3. Email\n4. Phone Number"
    }
  }
}
```

**Step 8: Connector Extracts Response**
```javascript
const responseMessage = response.data.data.result.responseMessage;
```

**Step 9: Send to Telegram**
```javascript
await this.bot.sendMessage(456789, responseMessage);
```

**Step 10: User Receives**
```
Bot: Welcome! To register as a vendor, please provide:
1. Company Name
2. Contact Person
3. Email
4. Phone Number
```

### Key Points

✅ Connector never calls Runtime directly  
✅ Connector never imports backend modules  
✅ All communication via HTTP  
✅ Backend doesn't know about Telegram specifics  
✅ Completely decoupled  

---

## 🔌 How WhatsApp Connector Could Be Added

### Implementation (No Backend Changes!)

**Step 1**: Create `whatsappConnector.js`

```javascript
const Connector = require('./connector.interface');
const axios = require('axios');
const { Client } = require('whatsapp-web.js');

class WhatsAppConnector extends Connector {
  constructor(config = {}) {
    super({ connectorId: 'whatsapp', ...config });
    this.apiBaseUrl = config.apiBaseUrl || 'http://localhost:3000';
    this.client = null;
  }

  async connect() {
    this.client = new Client();
    
    this.client.on('message', async (msg) => {
      await this.handleMessage(msg);
    });

    await this.client.initialize();
    this.connected = true;
  }

  async disconnect() {
    await this.client.destroy();
    this.connected = false;
  }

  normalizeInbound(whatsappMessage) {
    return {
      connectorId: 'whatsapp',
      workflowId: `workflow_whatsapp_${whatsappMessage.from}`,
      channelId: whatsappMessage.from,
      senderId: whatsappMessage.from,
      senderName: whatsappMessage.notifyName || 'User',
      text: whatsappMessage.body,
      attachments: this.extractAttachments(whatsappMessage),
      receivedAt: new Date(whatsappMessage.timestamp * 1000).toISOString()
    };
  }

  async sendMessage(channelId, message) {
    await this.client.sendMessage(channelId, message);
    this.incrementSent();
  }

  async sendFile(channelId, fileUrl, caption) {
    // Implementation
  }

  async healthCheck() {
    return {
      healthy: this.client?.info?.connected || false,
      phoneNumber: this.client?.info?.phoneNumber
    };
  }

  async handleMessage(msg) {
    this.incrementReceived();
    
    // Normalize
    const normalized = this.normalizeInbound(msg);
    
    // POST to backend (same as Telegram!)
    const response = await this.sendToBackendWithRetry(normalized);
    
    // Send response
    await this.sendMessage(
      normalized.channelId,
      response.result.responseMessage
    );
  }

  async sendToBackendWithRetry(message) {
    // Same retry logic as Telegram
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const response = await axios.post(
          `${this.apiBaseUrl}/api/connector/message`,
          message
        );
        return response.data.data;
      } catch (error) {
        if (attempt < 2) {
          await this.sleep([500, 1000, 2000][attempt]);
        }
      }
    }
    throw new Error('All retries exhausted');
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = WhatsAppConnector;
```

**Step 2**: Register and start

```javascript
const WhatsAppConnector = require('./connectors/whatsappConnector');
const connectorRegistry = require('./connectors/connectorRegistry');

const whatsapp = new WhatsAppConnector({
  apiBaseUrl: 'http://localhost:3000'
});

connectorRegistry.register('whatsapp', whatsapp);
await whatsapp.connect();
```

**Step 3**: Done!

### What Backend Sees

**From Telegram**:
```json
{
  "connectorId": "telegram",
  "workflowId": "workflow_telegram_123",
  "text": "Hello"
}
```

**From WhatsApp**:
```json
{
  "connectorId": "whatsapp",
  "workflowId": "workflow_whatsapp_456",
  "text": "Hello"
}
```

**Backend doesn't care!** Same endpoint, same processing, same response format.

### No Backend Changes Needed Because:

✅ Backend already has `/api/connector/message` endpoint  
✅ Backend processes normalized messages generically  
✅ Backend returns generic response  
✅ No Telegram-specific code in backend  
✅ No WhatsApp-specific code in backend  

---

## ✅ Backend Architecture Remained Unchanged

### Confirmation: ZERO Backend Modifications

| Component | Modified? | Proof |
|-----------|-----------|-------|
| WorkflowRuntime | ❌ No | Connectors call via HTTP |
| Planner Agent | ❌ No | Never imported by connectors |
| Tool Executor | ❌ No | Never imported by connectors |
| Business Tools | ❌ No | Never imported by connectors |
| Repositories | ❌ No | Never imported by connectors |
| Database Schema | ❌ No | No connector-specific tables |
| API Layer | ❌ No | `/api/connector/message` already existed |
| Services | ❌ No | Already handle normalized messages |
| Controllers | ❌ No | Already validate and respond |
| Routes | ❌ No | Already defined |
| Middleware | ❌ No | No changes needed |

### Why No Changes Needed?

The API layer (Phase 5) was designed with connectors in mind:

**Phase 5 Created**:
```
POST /api/connector/message
```

**Phase 6 Uses**:
```
Telegram → POST /api/connector/message
WhatsApp → POST /api/connector/message
ERP → POST /api/connector/message
```

**Perfect separation of concerns!**

---

## 📊 Summary

### Files Created

1. `connector.interface.js` - Abstract base class
2. `connectorRegistry.js` - Connector registry
3. `connectorMetrics.js` - Metrics collector
4. `telegramConnector.js` - Telegram implementation
5. `mockErpConnector.js` - ERP simulation
6. `README.md` - Documentation
7. `test-connectors.js` - Test suite

**Total**: 7 files, ~1,500 lines of code

### Dependencies Added

- `node-telegram-bot-api` - Telegram Bot API client
- `axios` - HTTP client for backend communication

### Architecture Achieved

```
External Systems (Telegram/WhatsApp/ERP)
        ↓
Connector Layer (transport adapters)
        ↓
HTTP POST /api/connector/message (complete decoupling)
        ↓
Backend API Layer
        ↓
Business Logic (Runtime/Planner/Tools/Repositories/Database)
```

### Benefits

✅ **Complete Decoupling** - Connectors don't know about backend  
✅ **HTTP-Only Communication** - No direct imports  
✅ **Independent Deployment** - Can deploy separately  
✅ **Language Flexibility** - Future connectors in any language  
✅ **Easy Testing** - Mock connectors without external systems  
✅ **Scalability** - Scale connectors independently  
✅ **Fault Isolation** - One connector failure doesn't affect others  
✅ **Extensibility** - Add connectors without backend changes  

---

**GitHub**: https://github.com/nidhi-kn/vendor-onboarding-agent  
**Status**: Phase 6 COMPLETE ✅

The connector layer is production-ready. Next step is to deploy the Telegram connector and test with real users.
