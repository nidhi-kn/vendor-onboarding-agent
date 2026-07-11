# Vendor Onboarding AI Agent

AI-powered vendor onboarding system that automates the vendor registration and compliance workflow through conversational interfaces (Telegram, WhatsApp, etc).

---

## 🎯 Features

✅ **AI-Powered Workflow Orchestration** - Groq-powered planner makes intelligent decisions  
✅ **Multi-Channel Support** - Telegram, WhatsApp (future), ERP integration  
✅ **Conversation Management** - Context-aware dialog handling  
✅ **Document Processing** - Handle PAN, GST, bank documents  
✅ **Approval Workflows** - Multi-level approval with audit trail  
✅ **Persistent Storage** - SQLite (dev) / PostgreSQL (production)  
✅ **REST API** - Complete HTTP API for integrations  
✅ **Extensible Connectors** - Easy to add new channels  

---

## 🏗️ Architecture

```
External Systems (Telegram/WhatsApp/ERP)
        ↓
Connector Layer (transport adapters)
        ↓
HTTP POST /api/connector/message
        ↓
REST API Layer (Express)
        ↓
Workflow Runtime
        ↓
Planner Agent (Groq AI)
        ↓
Tool Executor
        ↓
Business Tools
        ↓
Repository Layer
        ↓
Database (Prisma + SQLite/PostgreSQL)
```

**Key Design Principles**:
- Complete decoupling between layers
- HTTP-only communication for connectors
- No business logic in API or connector layers
- Persistent state with full audit trail

---

## 📁 Project Structure

```
vendor-onboarding-agent/
├── backend/
│   ├── src/
│   │   ├── agent/              # Planner agent
│   │   │   ├── planner.js
│   │   │   ├── plannerPrompt.js
│   │   │   ├── plannerSchema.js
│   │   │   └── workflowEngine.js
│   │   ├── connectors/         # Transport adapters
│   │   │   ├── connector.interface.js
│   │   │   ├── connectorRegistry.js
│   │   │   ├── connectorMetrics.js
│   │   │   ├── telegramConnector.js
│   │   │   └── mockErpConnector.js
│   │   ├── controllers/        # HTTP controllers
│   │   │   ├── workflow.controller.js
│   │   │   ├── connector.controller.js
│   │   │   ├── vendor.controller.js
│   │   │   ├── approval.controller.js
│   │   │   └── timeline.controller.js
│   │   ├── services/           # Business logic orchestration
│   │   │   ├── workflow.service.js
│   │   │   ├── connector.service.js
│   │   │   └── groqService.js
│   │   ├── routes/             # Express routes
│   │   ├── repositories/       # Database access
│   │   │   ├── vendorRepository.js
│   │   │   ├── workflowRepository.js
│   │   │   ├── messageRepository.js
│   │   │   ├── documentRepository.js
│   │   │   ├── approvalRepository.js
│   │   │   ├── agentRunRepository.js
│   │   │   └── auditLogRepository.js
│   │   ├── runtime/            # Workflow orchestration
│   │   │   ├── workflowRuntime.js
│   │   │   ├── workflowStateMachine.js
│   │   │   └── workflowDispatcher.js
│   │   ├── tools/              # Business tools
│   │   ├── executor/           # Tool execution
│   │   ├── registry/           # Tool registry
│   │   ├── middleware/         # Express middleware
│   │   ├── config/             # Configuration
│   │   ├── app.js              # Express app
│   │   └── server.js           # Server entry point
│   ├── prisma/
│   │   ├── schema.prisma       # Database schema
│   │   └── migrations/         # Database migrations
│   ├── prompts/
│   │   └── planner/
│   │       └── v1.md           # Planner system prompt
│   ├── test-connectors.js      # Connector tests
│   ├── test-api.js             # API tests
│   ├── test-integration.js     # End-to-end tests
│   ├── start-connectors.js     # Connector startup
│   ├── package.json
│   └── .env
├── API_LAYER.md                # API documentation
├── CONNECTOR_LAYER.md          # Connector documentation
├── PERSISTENCE_LAYER.md        # Database documentation
├── DEPLOYMENT_GUIDE.md         # Deployment guide
├── PHASE_5_SUMMARY.md          # API phase summary
├── PHASE_6_SUMMARY.md          # Connector phase summary
└── README.md                   # This file
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js v18+
- npm v9+
- Groq API key ([Get here](https://console.groq.com))
- Telegram bot token (optional, [Get here](https://t.me/BotFather))

### Installation

```bash
# Clone repository
git clone <repo-url>
cd vendor-onboarding-agent/backend

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env and add your GROQ_API_KEY

# Setup database
npx prisma generate
npx prisma migrate deploy
```

### Configuration

Edit `backend/.env`:

```bash
# Database
DATABASE_URL="file:./prisma/dev.db"

# Server
PORT=3000
NODE_ENV=development

# AI (Required)
GROQ_API_KEY=your_groq_api_key_here

# Connectors (Optional)
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
API_BASE_URL=http://localhost:3000
ENABLE_MOCK_ERP=false
```

### Run

**Terminal 1 - Start Backend**:
```bash
npm start
```

**Terminal 2 - Start Connectors** (if using Telegram):
```bash
npm run start:connectors
```

**Backend starts on**: http://localhost:3000

---

## 🧪 Testing

### Run All Tests

```bash
# Run all tests sequentially
npm run test:all
```

### Individual Test Suites

**Connector Layer Tests**:
```bash
npm run test:connectors
```

Tests:
- Abstract interface enforcement
- Registry with duplicate prevention
- Mock ERP operations
- Message normalization
- Retry logic with exponential backoff
- Metrics tracking
- Health checks

**API Layer Tests** (requires backend running):
```bash
# Terminal 1
npm start

# Terminal 2
npm run test:api
```

Tests:
- Health check endpoint
- Workflow processing
- Connector message endpoint
- Vendor retrieval
- Timeline/audit trail
- Approval workflow
- Error handling

**Integration Tests** (requires backend running):
```bash
# Terminal 1
npm start

# Terminal 2
npm run test:integration
```

Tests complete flow:
```
Connector → API → Runtime → Planner → Tools → Database
```

**Expected Test Results**:
```
✓ Connector Layer: All tests passed
✓ API Layer: All endpoints working
✓ Integration: Complete flow verified
```

---

## 📖 Documentation

### Architecture Documentation

- **[API_LAYER.md](./API_LAYER.md)** - REST API layer documentation
  - Endpoints
  - Request/response formats
  - Error handling
  - Controllers and services

- **[CONNECTOR_LAYER.md](./CONNECTOR_LAYER.md)** - Connector layer documentation
  - Connector interface
  - Message normalization
  - Retry strategy
  - Health checks
  - Adding new connectors

- **[PERSISTENCE_LAYER.md](./backend/PERSISTENCE_LAYER.md)** - Database layer documentation
  - Schema design
  - Repositories
  - Migrations
  - Data flow

### Implementation Summaries

- **[PHASE_5_SUMMARY.md](./PHASE_5_SUMMARY.md)** - API layer implementation
- **[PHASE_6_SUMMARY.md](./PHASE_6_SUMMARY.md)** - Connector layer implementation

### Deployment

- **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - Complete deployment guide
  - Environment setup
  - Running the system
  - Production deployment
  - Monitoring
  - Troubleshooting
  - Scaling

---

## 🔌 API Endpoints

### Health Check
```http
GET /health
```

### Connector Message (used by connectors)
```http
POST /api/connector/message
Content-Type: application/json

{
  "connectorId": "telegram",
  "workflowId": "workflow_123",
  "channelId": "456",
  "senderId": "789",
  "senderName": "John Doe",
  "text": "Hi, I want to register",
  "attachments": [],
  "receivedAt": "2026-07-11T10:00:00.000Z"
}
```

### Process Workflow
```http
POST /api/workflow/process
Content-Type: application/json

{
  "workflowId": "workflow_123",
  "trigger": "user_message",
  "incomingMessage": {
    "messageType": "text",
    "content": "Hello",
    "senderName": "John",
    "senderId": "789"
  }
}
```

### Get Workflow Details
```http
GET /api/workflow/:workflowId
```

### Get Vendor
```http
GET /api/vendor/:vendorId
```

### Get Timeline
```http
GET /api/timeline/:workflowId
```

### Approve/Reject
```http
POST /api/approval/:workflowId
Content-Type: application/json

{
  "action": "approve",
  "reason": "All documents verified",
  "approvedBy": "admin@company.com"
}
```

See [API_LAYER.md](./API_LAYER.md) for complete API documentation.

---

## 🤖 Telegram Integration

### Setup

1. **Create bot** via [@BotFather](https://t.me/BotFather):
   - Send `/newbot`
   - Follow instructions
   - Copy token

2. **Configure**:
   ```bash
   # backend/.env
   TELEGRAM_BOT_TOKEN=your_bot_token_here
   API_BASE_URL=http://localhost:3000
   ```

3. **Start**:
   ```bash
   # Terminal 1
   npm start
   
   # Terminal 2
   npm run start:connectors
   ```

4. **Test**:
   - Find your bot in Telegram
   - Send: "Hi, I want to register as a vendor"
   - Bot should respond with onboarding instructions

### Expected Flow

```
User: Hi, I want to register as a vendor

Bot: Welcome! To register as a vendor, please provide:
     1. Company Name
     2. Contact Person
     3. Email
     4. Phone Number

User: Company Name: Test Corp
      Contact: John Doe
      Email: john@test.com
      Phone: +91-9876543210

Bot: Thank you! Please upload the following documents:
     1. PAN Card
     2. GST Certificate
     3. Bank Account Details

[User uploads documents]

Bot: Documents received. Your application is under review.
     We'll notify you once approved.
```

---

## 🔧 Development

### Database Management

**View database in browser**:
```bash
npx prisma studio
```

Opens at http://localhost:5555

**Run migrations**:
```bash
npx prisma migrate dev
```

**Reset database**:
```bash
npx prisma migrate reset
```

### Adding a New Connector

Example: WhatsApp Connector

1. **Create connector file**: `src/connectors/whatsappConnector.js`

```javascript
const Connector = require('./connector.interface');
const axios = require('axios');

class WhatsAppConnector extends Connector {
  constructor(config = {}) {
    super({ connectorId: 'whatsapp', ...config });
    this.apiBaseUrl = config.apiBaseUrl;
  }

  async connect() {
    // Connect to WhatsApp Web API
    this.connected = true;
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

module.exports = WhatsAppConnector;
```

2. **Register in startup script**: `start-connectors.js`

```javascript
const WhatsAppConnector = require('./src/connectors/whatsappConnector');

if (process.env.WHATSAPP_API_KEY) {
  const whatsapp = new WhatsAppConnector({
    apiKey: process.env.WHATSAPP_API_KEY,
    apiBaseUrl: API_BASE_URL
  });
  connectors.push({ id: 'whatsapp', connector: whatsapp });
}
```

3. **Done!** No backend changes needed.

See [CONNECTOR_LAYER.md](./CONNECTOR_LAYER.md) for detailed guide.

### Adding a New Tool

Example: Send Email Tool

1. **Create tool file**: `src/tools/sendEmailTool.js`

```javascript
async function execute(args, context) {
  const { to, subject, body } = args;
  
  // Send email via service
  await emailService.send({ to, subject, body });
  
  return {
    success: true,
    message: `Email sent to ${to}`
  };
}

module.exports = {
  name: 'send_email',
  description: 'Send email to vendor',
  inputSchema: {
    type: 'object',
    properties: {
      to: { type: 'string' },
      subject: { type: 'string' },
      body: { type: 'string' }
    },
    required: ['to', 'subject', 'body']
  },
  execute
};
```

2. **Register tool**: `src/executor/initializeTools.js`

```javascript
const sendEmailTool = require('../tools/sendEmailTool');
toolRegistry.register(sendEmailTool);
```

3. **Update planner prompt**: Add tool to `prompts/planner/v1.md`

---

## 📊 Monitoring

### Health Check

```bash
curl http://localhost:3000/health
```

### Connector Metrics

Connectors log metrics every 5 minutes:

```json
{
  "service": "ConnectorMetricsReporter",
  "metrics": {
    "totalConnectors": 2,
    "totalReceived": 150,
    "totalSent": 145,
    "totalFailed": 5,
    "byConnector": {
      "telegram": {
        "received": 150,
        "sent": 145,
        "failed": 5
      }
    }
  }
}
```

### Database Queries

```sql
-- Recent workflows
SELECT * FROM Workflow ORDER BY createdAt DESC LIMIT 10;

-- Messages by workflow
SELECT * FROM Message WHERE workflowId = 'workflow_123' ORDER BY createdAt;

-- Audit trail
SELECT * FROM AuditLog WHERE workflowId = 'workflow_123' ORDER BY timestamp;

-- Agent runs (planner executions)
SELECT * FROM AgentRun WHERE workflowId = 'workflow_123' ORDER BY createdAt;
```

---

## 🚢 Production Deployment

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for complete guide.

### Quick Deploy

**Using PM2**:
```bash
# Install PM2
npm install -g pm2

# Start backend
pm2 start src/server.js --name vendor-backend

# Start connectors
pm2 start start-connectors.js --name vendor-connectors

# Monitor
pm2 monit
```

**Using Docker**:
```bash
docker build -t vendor-onboarding .
docker run -p 3000:3000 --env-file .env vendor-onboarding
```

### Environment Variables (Production)

```bash
# Database (PostgreSQL)
DATABASE_URL="postgresql://user:password@host:5432/db"

# Server
PORT=3000
NODE_ENV=production

# AI
GROQ_API_KEY=prod_key

# Connectors
TELEGRAM_BOT_TOKEN=prod_bot_token
API_BASE_URL=https://api.yourdomain.com
```

---

## 🔐 Security

### Environment Variables

Never commit:
- `.env` files
- API keys
- Bot tokens
- Database credentials

Use:
- AWS Secrets Manager
- HashiCorp Vault
- Azure Key Vault

### API Security

Add authentication middleware:

```javascript
const authenticateConnector = (req, res, next) => {
  const token = req.headers['x-connector-token'];
  if (token !== process.env.CONNECTOR_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

app.post('/api/connector/message', authenticateConnector, ...);
```

### Input Validation

All endpoints use Zod schemas for validation:

```javascript
const messageSchema = z.object({
  connectorId: z.string(),
  workflowId: z.string(),
  text: z.string(),
  // ...
});
```

---

## 🎯 Roadmap

### Phase 1-6 (Complete ✅)
- ✅ Planner agent
- ✅ Workflow runtime
- ✅ Tool executor
- ✅ Persistence layer
- ✅ REST API layer
- ✅ Connector layer
- ✅ Telegram integration

### Phase 7 (Next)
- [ ] WhatsApp connector
- [ ] Dashboard (Next.js)
- [ ] Real ERP integration
- [ ] Email notifications
- [ ] SMS notifications

### Phase 8 (Future)
- [ ] Multi-language support
- [ ] Advanced analytics
- [ ] Workflow templates
- [ ] Custom approval flows
- [ ] Bulk operations

---

## 🤝 Contributing

### Development Setup

```bash
git clone <repo-url>
cd vendor-onboarding-agent/backend
npm install
npx prisma generate
npx prisma migrate dev
```

### Running Tests

```bash
npm run test:all
```

### Code Style

- Use ES modules (CommonJS currently)
- JSDoc comments for all functions
- Descriptive variable names
- Small, focused files
- No TODOs in committed code

---

## 📝 License

MIT

---

## 🙏 Acknowledgments

- **Groq** - AI inference platform
- **Prisma** - Database ORM
- **Express** - Web framework
- **Telegram Bot API** - Telegram integration

---

## 📞 Support

**Documentation**:
- [API Documentation](./API_LAYER.md)
- [Connector Documentation](./CONNECTOR_LAYER.md)
- [Deployment Guide](./DEPLOYMENT_GUIDE.md)

**Testing**:
```bash
npm run test:all
```

**Issues**: Create an issue in the repository

---

## ✅ System Status

**Current Status**: Production Ready ✅

**Completed**:
- ✓ AI-powered workflow orchestration
- ✓ Multi-channel support (Telegram)
- ✓ REST API layer
- ✓ Connector abstraction
- ✓ Persistent storage
- ✓ Comprehensive testing
- ✓ Monitoring & metrics
- ✓ Health checks
- ✓ Audit logging
- ✓ Error handling
- ✓ Graceful shutdown

**Ready For**:
- ✓ Production deployment
- ✓ WhatsApp integration
- ✓ Dashboard development
- ✓ Real ERP integration
- ✓ Horizontal scaling

---

**Built with ❤️ for automating vendor onboarding**

