# Connector Layer Documentation

## Overview

Phase 6 implements a **transport abstraction layer** that allows external systems (Telegram, WhatsApp, ERP) to communicate with the backend **exclusively through HTTP**. Connectors are completely independent from the backend architecture.

---

## Architecture Principle

**Connectors are pure transport adapters with ZERO business logic.**

### What Connectors CANNOT Do

❌ Import WorkflowRuntime  
❌ Import Planner  
❌ Import ToolExecutor  
❌ Import Business Tools  
❌ Import Repositories  
❌ Import Database config  
❌ Make business decisions  
❌ Execute tools directly  
❌ Access database  

### What Connectors CAN Do

✅ Connect to external systems  
✅ Receive messages from external systems  
✅ Normalize messages to standard format  
✅ POST to `/api/connector/message` via HTTP  
✅ Receive HTTP responses  
✅ Send responses back to external systems  
✅ Track metrics  
✅ Perform health checks  

---

## Architecture Flow

```
Telegram User
↓
Telegram Bot API
↓
Telegram Connector (transport adapter)
↓
Message Normalization
↓
HTTP POST /api/connector/message
↓
Backend API Layer
↓
Workflow Runtime → Planner → Tools → Repositories → Database
↓
HTTP Response
↓
Telegram Connector
↓
Telegram Bot API
↓
User receives reply
```

**Key**: Connector and backend are completely decoupled. They only know about HTTP.

---

## Files Created

### 1. **connector.interface.js**
Abstract base class defining the connector contract.

**Required Methods**:
- `connect()` - Connect to external system
- `disconnect()` - Disconnect from external system
- `sendMessage(channelId, message)` - Send message
- `sendFile(channelId, fileUrl, caption)` - Send file
- `normalizeInbound(externalMessage)` - Convert external message to standard format
- `healthCheck()` - Check connector health
- `getMetrics()` - Get connector metrics

**Built-in Metrics**:
- `messagesReceived` - Total received
- `messagesSent` - Total sent
- `failedMessages` - Total failed
- `uptime` - Uptime in seconds
- `lastHeartbeat` - Last heartbeat timestamp
- `connected` - Connection status

### 2. **connectorRegistry.js**
Singleton registry for managing connector instances.

**Methods**:
- `register(connectorId, connector)` - Register connector (prevents duplicates)
- `get(connectorId)` - Get connector by ID
- `list()` - List all connector IDs
- `has(connectorId)` - Check if exists
- `unregister(connectorId)` - Remove connector
- `getAll()` - Get all connectors
- `getHealthStatus()` - Get health of all connectors

**Features**:
- Prevents duplicate registrations
- Logs all operations
- Centralized connector management

### 3. **connectorMetrics.js**
Singleton metrics collector for all connectors.

**Methods**:
- `register(connectorId)` - Register for tracking
- `updateStatus(connectorId, connected)` - Update connection status
- `recordReceived(connectorId)` - Record message received
- `recordSent(connectorId)` - Record message sent
- `recordFailed(connectorId)` - Record failed message
- `heartbeat(connectorId)` - Update heartbeat
- `getMetrics(connectorId)` - Get metrics for one connector
- `getAllMetrics()` - Get metrics for all connectors

### 4. **telegramConnector.js**
Telegram Bot connector implementation.

**Features**:
- Uses `node-telegram-bot-api` with long polling
- HTTP-only communication with backend
- Retry with exponential backoff (500ms, 1000ms, 2000ms)
- Error handling with user feedback
- Message normalization
- Attachment extraction (documents, photos)
- Health check via Telegram `getMe()` API

**Environment Variables**:
```bash
TELEGRAM_BOT_TOKEN=your_bot_token
API_BASE_URL=http://localhost:3000
```

### 5. **mockErpConnector.js**
Mock ERP connector for testing without real HTTP.

**Simulates**:
- `createVendor()` - Create vendor in ERP
- `syncVendor()` - Sync vendor to ERP
- `getVendorStatus()` - Get vendor status from ERP
- `getSyncLog()` - Get sync history

**Purpose**: Demonstrates ERP integration pattern for future implementation.

### 6. **README.md**
Complete connector documentation with examples.

---

## Normalized Message Format

All connectors MUST convert external messages to this standard format:

```javascript
{
  connectorId: 'telegram',              // Connector identifier
  workflowId: 'workflow_telegram_123',  // Unique workflow ID
  channelId: '123456789',               // Channel/chat/conversation ID
  senderId: '987654321',                // User/sender ID
  senderName: 'John Doe',               // User/sender name
  text: 'Hello',                        // Message text
  attachments: [                        // Optional attachments
    {
      type: 'document',
      fileId: 'file123',
      fileName: 'document.pdf',
      mimeType: 'application/pdf',
      fileSize: 12345
    }
  ],
  receivedAt: '2026-07-11T08:00:00.000Z' // ISO timestamp
}
```

**Critical Rules**:
1. ✅ No connector-specific fields (e.g., no `message_id`, `chat`, `from` from Telegram)
2. ✅ Use generic field names
3. ✅ All IDs as strings
4. ✅ ISO timestamps
5. ✅ Attachments as array (empty if none)

---

## Telegram Connector Deep Dive

### Connection

```javascript
const TelegramConnector = require('./src/connectors/telegramConnector');

const telegram = new TelegramConnector({
  botToken: process.env.TELEGRAM_BOT_TOKEN,
  apiBaseUrl: 'http://localhost:3000'
});

await telegram.connect();
```

### Message Flow

**1. User sends message to Telegram bot**

**2. Telegram Bot API delivers message**:
```javascript
{
  message_id: 123,
  chat: { id: 456789 },
  from: { id: 987654, username: 'testuser' },
  text: 'Hi, I want to register',
  date: 1234567890
}
```

**3. Connector normalizes**:
```javascript
{
  connectorId: 'telegram',
  workflowId: 'workflow_telegram_456789',
  channelId: '456789',
  senderId: '987654',
  senderName: 'testuser',
  text: 'Hi, I want to register',
  attachments: [],
  receivedAt: '2026-07-11T08:00:00.000Z'
}
```

**4. Connector sends to backend with retry**:
```javascript
POST http://localhost:3000/api/connector/message
Content-Type: application/json

{
  connectorId: 'telegram',
  workflowId: 'workflow_telegram_456789',
  // ... normalized message
}
```

**5. Backend processes and returns**:
```javascript
{
  success: true,
  data: {
    connectorId: 'telegram',
    workflowId: 'workflow_telegram_456789',
    processed: true,
    result: {
      workflowState: 'WAITING_VENDOR_DETAILS',
      responseMessage: 'Welcome! Please provide your company details...'
    }
  }
}
```

**6. Connector extracts response message**:
```javascript
const responseMessage = response.data.data.result.responseMessage;
```

**7. Connector sends to Telegram**:
```javascript
await bot.sendMessage(chatId, responseMessage);
```

**8. User receives reply in Telegram**

---

## Retry Strategy

When posting to `/api/connector/message`, connectors implement exponential backoff:

### Configuration

```javascript
{
  maxRetries: 3,
  delays: [500, 1000, 2000]  // Exponential backoff
}
```

### Implementation

```javascript
async function sendToBackend(message) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await axios.post(url, message, {
        timeout: 30000
      });
      return response.data;
    } catch (error) {
      if (attempt < 2) {
        await sleep(delays[attempt]);
      }
    }
  }
  throw new Error('All retries exhausted');
}
```

### Behavior

| Attempt | Delay Before | Total Wait |
|---------|--------------|------------|
| 1       | 0ms          | 0ms        |
| 2       | 500ms        | 500ms      |
| 3       | 1000ms       | 1500ms     |
| Fail    | 2000ms       | 3500ms     |

### Failure Handling

After all retries:
1. Log error
2. Increment `failedMessages` metric
3. Send error message to user (Telegram)
4. Throw error for monitoring

---

## Health Checks

Each connector implements `healthCheck()`:

### Telegram Health Check

```javascript
async healthCheck() {
  try {
    const me = await this.bot.getMe();
    return {
      healthy: true,
      botInfo: {
        id: me.id,
        username: me.username,
        firstName: me.first_name
      },
      connected: this.connected
    };
  } catch (error) {
    return {
      healthy: false,
      error: error.message
    };
  }
}
```

### Mock ERP Health Check

```javascript
async healthCheck() {
  return {
    healthy: true,
    message: 'Mock ERP is always healthy',
    connected: this.connected,
    vendorCount: this.vendors.size,
    syncLogEntries: this.syncLog.length
  };
}
```

### Usage

```javascript
const health = await connector.healthCheck();
console.log(health.healthy); // true/false
```

---

## Metrics

Each connector tracks operational metrics:

```javascript
{
  connectorId: 'telegram',
  connected: true,
  messagesReceived: 150,
  messagesSent: 145,
  failedMessages: 5,
  uptimeSeconds: 3600,
  lastHeartbeat: '2026-07-11T08:00:00.000Z'
}
```

### Accessing Metrics

**Individual Connector**:
```javascript
const metrics = connector.getMetrics();
```

**All Connectors (via Metrics Module)**:
```javascript
const allMetrics = connectorMetrics.getAllMetrics();
```

**All Connectors (via Registry)**:
```javascript
const connectors = connectorRegistry.getAll();
for (const [id, connector] of connectors) {
  console.log(connector.getMetrics());
}
```

---

## Adding a New Connector

### Example: WhatsApp Connector

**Step 1**: Create file `whatsappConnector.js`

```javascript
const Connector = require('./connector.interface');
const axios = require('axios');
const WhatsAppAPI = require('whatsapp-web.js'); // example library

class WhatsAppConnector extends Connector {
  constructor(config = {}) {
    super({
      connectorId: 'whatsapp',
      ...config
    });
    
    this.apiBaseUrl = config.apiBaseUrl || 'http://localhost:3000';
    this.client = null;
  }

  async connect() {
    this.client = new WhatsAppAPI.Client({
      // ... config
    });

    this.client.on('message', (msg) => this.handleMessage(msg));

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
      attachments: [],
      receivedAt: new Date().toISOString()
    };
  }

  async sendMessage(channelId, message) {
    await this.client.sendMessage(channelId, message);
  }

  async sendFile(channelId, fileUrl, caption) {
    // Download file and send via WhatsApp
  }

  async healthCheck() {
    return {
      healthy: this.client?.info?.connected || false
    };
  }

  async handleMessage(msg) {
    const normalized = this.normalizeInbound(msg);
    
    // POST to backend with retry
    const response = await this.sendToBackendWithRetry(normalized);
    
    // Send response back
    await this.sendMessage(
      normalized.channelId,
      response.result.responseMessage
    );
  }
}

module.exports = WhatsAppConnector;
```

**Step 2**: Register connector

```javascript
const connectorRegistry = require('./connectorRegistry');
const WhatsAppConnector = require('./whatsappConnector');

const whatsapp = new WhatsAppConnector({
  apiBaseUrl: 'http://localhost:3000'
});

connectorRegistry.register('whatsapp', whatsapp);
await whatsapp.connect();
```

**Step 3**: Done! No backend changes needed.

---

## Backend Confirmation

### What Was NOT Modified

✅ WorkflowRuntime - unchanged  
✅ Planner Agent - unchanged  
✅ Tool Executor - unchanged  
✅ Business Tools - unchanged  
✅ Repositories - unchanged  
✅ Database schema - unchanged  
✅ API layer - unchanged  
✅ Services - unchanged  
✅ Controllers - unchanged  
✅ Routes - unchanged  

### What Backend Provides

The backend exposes ONE endpoint for all connectors:

```
POST /api/connector/message
```

This endpoint was already built in Phase 5 (API Layer). No modifications needed.

---

## Deployment Options

### Option 1: Monolithic (Development)

```
┌─────────────────────────────────────┐
│  Single Process                     │
│  ├── Backend API (Express)          │
│  └── Connectors (in same process)  │
└─────────────────────────────────────┘
```

### Option 2: Microservices (Production)

```
┌──────────────┐       ┌──────────────┐
│  Backend API │       │  Telegram    │
│  Port 3000   │◄──────│  Connector   │
└──────────────┘ HTTP  └──────────────┘
       ▲
       │ HTTP
       │
┌──────────────┐
│  WhatsApp    │
│  Connector   │
└──────────────┘
```

### Option 3: Serverless

```
Telegram Webhook
↓
AWS Lambda (Telegram Connector)
↓
HTTP POST
↓
Backend API (ECS/EC2)
```

---

## Testing

### Run Tests

```bash
node test-connectors.js
```

### Test Coverage

1. ✅ Abstract interface enforcement
2. ✅ Connector registry (duplicates prevented)
3. ✅ Mock ERP operations
4. ✅ Message normalization (no external fields)
5. ✅ Retry logic with exponential backoff
6. ✅ Metrics tracking
7. ✅ Health checks

### Manual Telegram Testing

**Prerequisites**:
1. Create Telegram bot via @BotFather
2. Get bot token
3. Set in `.env`:
   ```bash
   TELEGRAM_BOT_TOKEN=your_bot_token
   API_BASE_URL=http://localhost:3000
   ```

**Steps**:
1. Start backend: `npm start`
2. Start Telegram connector (separate script or in server)
3. Send message to bot
4. Bot replies with backend response

---

## Error Handling

### Connector-Level Errors

**When message fails after all retries**:
```javascript
try {
  await this.handleIncomingMessage(msg);
} catch (error) {
  this.incrementFailed();
  
  // Send error to user
  await this.bot.sendMessage(
    msg.chat.id,
    'Sorry, I encountered an error. Please try again.'
  );
  
  // Log for monitoring
  console.error({
    error: error.message,
    chatId: msg.chat.id,
    timestamp: new Date().toISOString()
  });
}
```

### Backend Errors

If backend returns HTTP error:
```javascript
{
  success: false,
  error: {
    code: 'VALIDATION_ERROR',
    message: 'workflowId is required'
  }
}
```

Connector handles gracefully and informs user.

---

## Monitoring

### Metrics to Track

```javascript
// Per connector
- messagesReceived
- messagesSent
- failedMessages
- uptime
- lastHeartbeat
- connected

// Aggregated
- Total messages across all connectors
- Average latency
- Error rate
- Health status
```

### Alerting

```javascript
// Example: Alert if failed messages > 10
if (metrics.failedMessages > 10) {
  sendAlert('Connector failing frequently');
}

// Alert if no heartbeat for 5 minutes
const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
if (new Date(metrics.lastHeartbeat) < fiveMinutesAgo) {
  sendAlert('Connector appears dead');
}
```

---

## Summary

### Architecture Achieved

```
External Systems (Telegram/WhatsApp/ERP)
↓
Connector Layer (transport adapters)
↓
HTTP (complete decoupling)
↓
Backend API Layer
↓
Business Logic (Runtime/Planner/Tools)
```

### Benefits

✅ **Complete Decoupling**: Connectors don't know about backend internals  
✅ **Independent Deployment**: Can deploy connectors separately  
✅ **Language Flexibility**: Future connectors can be in Python, Go, etc.  
✅ **Easy Testing**: Mock connectors don't need external systems  
✅ **Scalability**: Scale connectors independently from backend  
✅ **Fault Isolation**: Telegram failure doesn't affect WhatsApp  
✅ **Extensibility**: Add new connectors without backend changes  

### Files Created

- 6 connector files (interface, registry, metrics, telegram, mockErp, README)
- 1 test file
- ~1,500 lines of code
- 2 dependencies (node-telegram-bot-api, axios)
- 0 backend modifications

---

**Status**: Phase 6 COMPLETE ✅  
**Next**: Deploy Telegram connector to production and test with real users.
