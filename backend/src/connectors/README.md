# Connectors

Transport adapters for external system integration. Connectors are **completely independent** from the backend architecture.

## Architecture Principle

**Connectors NEVER import backend modules.**

Connectors communicate ONLY through HTTP:
- `POST /api/connector/message` - Send normalized messages to backend

## Connector Responsibilities

Connectors are transport adapters that:
1. Connect to external systems (Telegram, WhatsApp, ERP)
2. Receive messages from external systems
3. Normalize messages to standard format
4. Send to backend via HTTP
5. Receive responses from backend
6. Send responses back to external system

## What Connectors CANNOT Do

❌ Import WorkflowRuntime  
❌ Import Planner  
❌ Import ToolExecutor  
❌ Import Business Tools  
❌ Import Repositories  
❌ Contain business logic  
❌ Make decisions  
❌ Access database directly  

## Files

### connector.interface.js
Abstract base class that all connectors must extend.

**Required Methods**:
- `connect()` - Connect to external system
- `disconnect()` - Disconnect from external system
- `sendMessage(channelId, message)` - Send message
- `sendFile(channelId, fileUrl, caption)` - Send file
- `normalizeInbound(externalMessage)` - Normalize incoming message
- `healthCheck()` - Health check
- `getMetrics()` - Get connector metrics

### connectorRegistry.js
Registry for managing connector instances.

**Methods**:
- `register(connectorId, connector)` - Register connector
- `get(connectorId)` - Get connector by ID
- `list()` - List all connector IDs
- `has(connectorId)` - Check if connector exists
- `getHealthStatus()` - Get health status of all connectors

### connectorMetrics.js
Centralized metrics collection.

**Tracks**:
- `messagesReceived` - Total messages received
- `messagesSent` - Total messages sent
- `failedMessages` - Total failed messages
- `uptime` - Connector uptime in seconds
- `lastHeartbeat` - Last heartbeat timestamp
- `connected` - Connection status

### telegramConnector.js
Telegram Bot connector implementation.

**Features**:
- Long polling for messages
- Message normalization
- HTTP communication with backend
- Retry with exponential backoff (500ms, 1000ms, 2000ms)
- Error handling with user feedback
- Health check via Telegram `getMe()` API

**Environment Variables**:
- `TELEGRAM_BOT_TOKEN` - Telegram bot token
- `API_BASE_URL` - Backend API URL (default: http://localhost:3000)

### mockErpConnector.js
Mock ERP connector for testing.

**Simulates**:
- Vendor creation
- Vendor sync
- Vendor status retrieval

**Purpose**: Demonstrates ERP integration pattern without real HTTP.

---

## Normalized Message Format

All connectors must convert external messages to this format:

```javascript
{
  connectorId: 'telegram',              // Connector identifier
  workflowId: 'workflow_telegram_123',  // Workflow identifier
  channelId: '123456789',               // Channel/chat ID
  senderId: '987654321',                // Sender user ID
  senderName: 'John Doe',               // Sender name
  text: 'Hello',                        // Message text
  attachments: [                        // Attachments (optional)
    {
      type: 'document',
      fileId: 'file123',
      fileName: 'document.pdf'
    }
  ],
  receivedAt: '2026-07-11T08:00:00.000Z' // ISO timestamp
}
```

**No connector-specific fields** should leave the connector.

---

## Telegram Connector Flow

```
Telegram User sends message
↓
Telegram Bot API
↓
TelegramConnector.handleIncomingMessage()
↓
normalizeInbound() - Convert to standard format
↓
sendToBackend() with retry (3 attempts: 500ms, 1000ms, 2000ms)
↓
POST http://localhost:3000/api/connector/message
↓
Backend processes (WorkflowRuntime → Planner → Tools)
↓
Backend returns response
↓
TelegramConnector.sendMessage()
↓
Telegram Bot API
↓
User receives reply
```

---

## Retry Strategy

When calling `POST /api/connector/message`:

**Configuration**:
- Max retries: 3
- Delays: 500ms, 1000ms, 2000ms (exponential backoff)
- Timeout: 30 seconds per request

**Implementation**:
```javascript
for (let attempt = 0; attempt < 3; attempt++) {
  try {
    const response = await axios.post(url, message);
    return response.data;
  } catch (error) {
    if (attempt < 2) {
      await sleep(delays[attempt]);
    }
  }
}
throw new Error('All retries exhausted');
```

**Failure Handling**:
- Log error
- Increment `failedMessages` metric
- Send error message to user (Telegram)
- Throw error for monitoring

---

## Health Checks

Each connector implements `healthCheck()`:

**Telegram**:
- Calls Telegram `getMe()` API
- Returns bot info if healthy

**Mock ERP**:
- Always returns healthy
- Returns vendor count and sync log size

**Health Check Endpoint**:
```javascript
const health = await connector.healthCheck();
// {
//   healthy: true/false,
//   message: '...',
//   botInfo: {...},
//   connected: true
// }
```

---

## Metrics

Each connector tracks:

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

**Accessed via**:
```javascript
const metrics = connector.getMetrics();
```

---

## Adding a New Connector

### Example: WhatsApp Connector

1. **Create connector file**: `whatsappConnector.js`

2. **Extend Connector class**:
```javascript
const Connector = require('./connector.interface');

class WhatsAppConnector extends Connector {
  constructor(config) {
    super({ connectorId: 'whatsapp', ...config });
  }

  async connect() {
    // Connect to WhatsApp Web API
  }

  async disconnect() {
    // Disconnect
  }

  normalizeInbound(whatsappMessage) {
    return {
      connectorId: 'whatsapp',
      workflowId: `workflow_whatsapp_${whatsappMessage.from}`,
      channelId: whatsappMessage.from,
      senderId: whatsappMessage.from,
      senderName: whatsappMessage.notifyName,
      text: whatsappMessage.body,
      attachments: [],
      receivedAt: new Date().toISOString()
    };
  }

  async sendMessage(channelId, message) {
    // Send via WhatsApp API
  }

  // ... other methods
}
```

3. **Register connector**:
```javascript
const connectorRegistry = require('./connectorRegistry');
const whatsapp = new WhatsAppConnector({ apiKey: '...' });
connectorRegistry.register('whatsapp', whatsapp);
await whatsapp.connect();
```

4. **Done!** No backend changes needed.

---

## Testing

Test file: `test-connectors.js`

**Tests**:
- Connector registration
- Message normalization
- Retry logic
- Health checks
- Metrics tracking
- Mock ERP operations

**Run**:
```bash
node test-connectors.js
```

---

## Environment Variables

### Telegram Connector
```bash
TELEGRAM_BOT_TOKEN=your_bot_token
API_BASE_URL=http://localhost:3000
```

### Future Connectors
```bash
WHATSAPP_API_KEY=...
ERP_API_URL=https://erp.company.com
ERP_API_KEY=...
```

---

## Deployment

Connectors can be deployed **independently** from the backend:

```
┌──────────────────┐       ┌──────────────────┐
│  Backend API     │       │  Connectors      │
│  (Port 3000)     │◄──────│  (Separate       │
│                  │ HTTP  │   Process)       │
│  - Planner       │       │  - Telegram      │
│  - Runtime       │       │  - WhatsApp      │
│  - Tools         │       │  - ERP           │
└──────────────────┘       └──────────────────┘
```

**Benefits**:
- Independent scaling
- Independent deployment
- Fault isolation
- Language flexibility (can be in Python, Go, etc.)

---

## Summary

Connectors are **pure transport adapters**:
- ✅ Receive from external system
- ✅ Normalize message
- ✅ POST to backend HTTP API
- ✅ Return response to external system
- ❌ No business logic
- ❌ No backend imports
- ❌ No database access

**Result**: Clean separation of concerns. Backend doesn't know about Telegram, WhatsApp, or ERP specifics.
