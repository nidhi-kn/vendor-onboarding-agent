# Deployment Guide

Complete guide for deploying the Vendor Onboarding AI Agent system.

---

## System Architecture

```
External Systems (Telegram/WhatsApp/ERP)
        ↓
Connector Layer (Transport Adapters)
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
Database (SQLite/PostgreSQL via Prisma)
```

---

## Prerequisites

- **Node.js**: v18+ 
- **npm**: v9+
- **Database**: SQLite (dev) or PostgreSQL (production)
- **Groq API Key**: For AI planner
- **Telegram Bot Token**: (Optional) For Telegram integration

---

## Environment Setup

### 1. Backend Environment Variables

Create `backend/.env`:

```bash
# Database
DATABASE_URL="file:./prisma/dev.db"

# API Server
PORT=3000
NODE_ENV=development

# Groq AI (Required for Planner)
GROQ_API_KEY=your_groq_api_key_here

# Connectors (Optional)
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
API_BASE_URL=http://localhost:3000
ENABLE_MOCK_ERP=false
```

### 2. Get Groq API Key

1. Visit https://console.groq.com
2. Sign up / Log in
3. Generate API key
4. Add to `.env` as `GROQ_API_KEY`

### 3. Get Telegram Bot Token (Optional)

1. Open Telegram and search for `@BotFather`
2. Send `/newbot` command
3. Follow instructions to create bot
4. Copy token
5. Add to `.env` as `TELEGRAM_BOT_TOKEN`

---

## Installation

### 1. Install Dependencies

```bash
cd backend
npm install
```

**Dependencies installed**:
- express - Web framework
- @prisma/client - Database ORM
- groq-sdk - AI SDK
- axios - HTTP client
- node-telegram-bot-api - Telegram integration
- cors - CORS middleware
- morgan - HTTP logging
- dotenv - Environment variables
- uuid - UUID generation
- zod - Schema validation

### 2. Setup Database

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# (Optional) View database in browser
npx prisma studio
```

**Database schema includes**:
- Vendor
- Workflow
- Message
- Document
- Approval
- AgentRun
- AuditLog

---

## Running the System

### Option 1: Monolithic (Development)

Run backend and connectors in single process:

```bash
# Terminal 1: Start backend
npm start

# Terminal 2: Start connectors
node start-connectors.js
```

### Option 2: Separate Processes (Production-like)

Run backend and connectors independently:

```bash
# Terminal 1: Backend API
npm start

# Terminal 2: Connectors
node start-connectors.js
```

### Option 3: With PM2 (Production)

```bash
# Install PM2
npm install -g pm2

# Start backend
pm2 start src/server.js --name vendor-backend

# Start connectors
pm2 start start-connectors.js --name vendor-connectors

# View logs
pm2 logs

# Monitor
pm2 monit

# Stop all
pm2 stop all
```

---

## Testing

### 1. Run Unit Tests

```bash
# Test connector layer
node test-connectors.js
```

**Tests**:
- ✓ Abstract interface enforcement
- ✓ Connector registry
- ✓ Mock ERP operations
- ✓ Message normalization
- ✓ Retry logic
- ✓ Metrics tracking
- ✓ Health checks

### 2. Run API Tests

```bash
# Start backend first
npm start

# In another terminal
node test-api.js
```

**Tests**:
- ✓ Health check
- ✓ Workflow processing
- ✓ Connector message endpoint
- ✓ Vendor retrieval
- ✓ Timeline/audit log
- ✓ Error handling

### 3. Run Integration Tests

```bash
# Start backend first
npm start

# In another terminal
node test-integration.js
```

**Tests complete flow**:
```
Connector → API → Runtime → Planner → Tools → Database
```

### 4. Manual Telegram Testing

**Prerequisites**:
1. Set `TELEGRAM_BOT_TOKEN` in `.env`
2. Start backend: `npm start`
3. Start connectors: `node start-connectors.js`
4. Open Telegram and find your bot

**Test Flow**:
1. Send message to bot: "Hi, I want to register as a vendor"
2. Bot should respond with onboarding instructions
3. Provide company details
4. Bot guides through onboarding steps

**Expected behavior**:
- Bot responds within 2-3 seconds
- Messages saved to database
- Workflow state transitions
- Audit logs created
- Agent runs recorded

---

## Monitoring

### 1. Health Checks

**Backend health**:
```bash
curl http://localhost:3000/health
```

**Expected response**:
```json
{
  "status": "healthy",
  "timestamp": "2026-07-11T10:00:00.000Z",
  "uptime": 3600,
  "service": "vendor-onboarding-backend"
}
```

### 2. Connector Metrics

Connectors automatically log metrics every 5 minutes:

```json
{
  "timestamp": "2026-07-11T10:00:00.000Z",
  "level": "info",
  "service": "ConnectorMetricsReporter",
  "message": "Connector metrics",
  "metrics": {
    "totalConnectors": 2,
    "totalReceived": 150,
    "totalSent": 145,
    "totalFailed": 5,
    "byConnector": {
      "telegram": {
        "received": 150,
        "sent": 145,
        "failed": 5,
        "uptime": 3600,
        "connected": true
      }
    }
  }
}
```

### 3. Database Monitoring

**Using Prisma Studio** (GUI):
```bash
npx prisma studio
```

Opens browser at http://localhost:5555

**Using SQL**:
```bash
sqlite3 prisma/dev.db

# Check workflows
SELECT * FROM Workflow;

# Check messages
SELECT * FROM Message;

# Check vendors
SELECT * FROM Vendor;

# Check audit logs
SELECT * FROM AuditLog ORDER BY timestamp DESC LIMIT 10;
```

### 4. Logs

**Backend logs** (JSON format):
```json
{
  "timestamp": "2026-07-11T10:00:00.000Z",
  "level": "info",
  "service": "Server",
  "message": "Server started on port 3000"
}
```

**Connector logs**:
```json
{
  "timestamp": "2026-07-11T10:00:00.000Z",
  "level": "info",
  "service": "TelegramConnector",
  "message": "Message received",
  "workflowId": "workflow_telegram_123"
}
```

---

## Production Deployment

### 1. Environment Variables

```bash
# Database (PostgreSQL)
DATABASE_URL="postgresql://user:password@localhost:5432/vendor_onboarding"

# API Server
PORT=3000
NODE_ENV=production

# Groq AI
GROQ_API_KEY=your_production_key

# Connectors
TELEGRAM_BOT_TOKEN=your_production_bot_token
API_BASE_URL=https://api.yourdomain.com
ENABLE_MOCK_ERP=false
```

### 2. Database Migration

```bash
# Switch to PostgreSQL
# Update DATABASE_URL in .env

# Run migrations
npx prisma migrate deploy

# Generate client
npx prisma generate
```

### 3. Build & Deploy

**Using Docker** (recommended):

Create `Dockerfile`:
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --production

# Copy Prisma schema
COPY prisma ./prisma/
RUN npx prisma generate

# Copy source
COPY src ./src/
COPY start-connectors.js ./

# Expose port
EXPOSE 3000

# Start
CMD ["node", "src/server.js"]
```

Build and run:
```bash
docker build -t vendor-onboarding-backend .
docker run -p 3000:3000 --env-file .env vendor-onboarding-backend
```

**Using PM2**:
```bash
# Install PM2
npm install -g pm2

# Start backend
pm2 start src/server.js --name vendor-backend -i max

# Start connectors
pm2 start start-connectors.js --name vendor-connectors

# Save process list
pm2 save

# Setup auto-restart on reboot
pm2 startup
```

### 4. Reverse Proxy (Nginx)

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

### 5. SSL Certificate (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.yourdomain.com
```

---

## Scaling

### 1. Backend Scaling

**Horizontal scaling** (multiple instances):

```bash
# Using PM2 cluster mode
pm2 start src/server.js -i max

# Using Docker + Load Balancer
# Run multiple containers behind Nginx/HAProxy
```

**Vertical scaling**:
- Increase CPU/RAM allocation
- Optimize database queries
- Add database indexes

### 2. Connector Scaling

**Option 1**: One connector instance per external system
```bash
pm2 start start-connectors.js --name connectors
```

**Option 2**: Separate processes per connector
```bash
# Telegram only
ENABLE_MOCK_ERP=false node start-connectors.js

# WhatsApp only (future)
ENABLE_TELEGRAM=false ENABLE_WHATSAPP=true node start-connectors.js
```

**Option 3**: Separate servers
```
Server 1: Backend API
Server 2: Telegram Connector
Server 3: WhatsApp Connector
Server 4: ERP Connector
```

### 3. Database Scaling

**Read replicas**:
```javascript
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL, // writes
    },
  },
});

const prismaReadReplica = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_READ_URL, // reads
    },
  },
});
```

**Connection pooling**:
```bash
DATABASE_URL="postgresql://user:password@localhost:5432/db?connection_limit=20"
```

---

## Troubleshooting

### Backend won't start

**Check**:
1. `.env` file exists and has `GROQ_API_KEY`
2. Database migrations ran: `npx prisma migrate deploy`
3. Prisma client generated: `npx prisma generate`
4. Port 3000 is available: `netstat -an | findstr 3000`

**Logs**:
```bash
# Check logs
npm start

# Look for errors like:
# - "GROQ_API_KEY is required"
# - "Database connection failed"
# - "Port 3000 already in use"
```

### Connectors won't start

**Check**:
1. Backend is running: `curl http://localhost:3000/health`
2. `TELEGRAM_BOT_TOKEN` is set (if using Telegram)
3. Bot token is valid: Test with `curl https://api.telegram.org/bot<TOKEN>/getMe`

**Logs**:
```bash
node start-connectors.js

# Look for:
# - "TELEGRAM_BOT_TOKEN not found"
# - "Failed to connect telegram"
# - "Backend unavailable"
```

### Planner not responding

**Check**:
1. Groq API key is valid
2. Groq API is reachable: `curl https://api.groq.com/openai/v1/models -H "Authorization: Bearer $GROQ_API_KEY"`
3. Prompt file exists: `backend/prompts/planner/v1.md`

**Test planner**:
```bash
node tests/planner.test.js
```

### Messages not saving

**Check**:
1. Database connection: `npx prisma studio`
2. Migrations ran: `npx prisma migrate status`
3. Workflow created: Check `Workflow` table

**Debug**:
```javascript
// Add logging in messageRepository.js
console.log('Saving message:', message);
```

### Telegram bot not responding

**Check**:
1. Bot token valid
2. Connectors running
3. Backend reachable from connectors
4. No firewall blocking

**Test manually**:
```bash
# Send test message via HTTP
curl -X POST http://localhost:3000/api/connector/message \
  -H "Content-Type: application/json" \
  -d '{
    "connectorId": "telegram",
    "workflowId": "test_workflow",
    "channelId": "123",
    "senderId": "456",
    "senderName": "Test",
    "text": "Hello",
    "attachments": [],
    "receivedAt": "'$(date -u +%Y-%m-%dT%H:%M:%S.000Z)'"
  }'
```

---

## API Endpoints

### Public Endpoints

**Health Check**:
```
GET /health
```

**Connector Message** (used by connectors):
```
POST /api/connector/message
Body: {
  connectorId: string
  workflowId: string
  channelId: string
  senderId: string
  senderName: string
  text: string
  attachments: array
  receivedAt: ISO timestamp
}
```

### Workflow Endpoints

**Process workflow**:
```
POST /api/workflow/process
Body: {
  workflowId: string
  trigger: string
  incomingMessage: object
}
```

**Get workflow**:
```
GET /api/workflow/:id
```

### Vendor Endpoints

**Get vendor**:
```
GET /api/vendor/:id
```

### Timeline Endpoints

**Get audit trail**:
```
GET /api/timeline/:workflowId
```

### Approval Endpoints

**Approve/reject**:
```
POST /api/approval/:workflowId
Body: {
  action: 'approve' | 'reject'
  reason: string
  approvedBy: string
}
```

---

## Performance Optimization

### 1. Database

**Add indexes**:
```sql
CREATE INDEX idx_workflow_id ON Message(workflowId);
CREATE INDEX idx_vendor_email ON Vendor(email);
CREATE INDEX idx_workflow_state ON Workflow(currentState);
```

**Connection pooling**:
```bash
DATABASE_URL="postgresql://...?connection_limit=20"
```

### 2. Caching

**Redis for workflow state**:
```javascript
const redis = require('redis');
const client = redis.createClient();

// Cache workflow state
await client.set(`workflow:${id}`, JSON.stringify(workflow), 'EX', 3600);
```

### 3. Rate Limiting

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // requests per window
});

app.use('/api/', limiter);
```

---

## Security

### 1. Environment Variables

**Never commit**:
- `.env` files
- API keys
- Bot tokens
- Database credentials

**Use secrets management**:
- AWS Secrets Manager
- HashiCorp Vault
- Azure Key Vault

### 2. API Security

**Add authentication**:
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

**CORS configuration**:
```javascript
const cors = require('cors');
app.use(cors({
  origin: ['https://dashboard.yourdomain.com'],
  credentials: true
}));
```

### 3. Input Validation

Already implemented using Zod schemas in services.

### 4. SQL Injection Prevention

Prisma automatically prevents SQL injection through parameterized queries.

---

## Next Steps

### 1. Add WhatsApp Connector

Create `whatsappConnector.js` following the same pattern as Telegram.

### 2. Build Dashboard

Create Next.js dashboard to:
- View workflows
- Manage vendors
- Approve/reject
- View analytics

### 3. Add ERP Integration

Replace `mockErpConnector.js` with real ERP HTTP client.

### 4. Add Notifications

- Email notifications (SendGrid, AWS SES)
- SMS notifications (Twilio)
- Slack notifications

### 5. Add Analytics

- Workflow completion rates
- Average onboarding time
- Bottleneck identification
- Success metrics

---

## Support

**Documentation**:
- `README.md` - Project overview
- `API_LAYER.md` - API documentation
- `CONNECTOR_LAYER.md` - Connector documentation
- `PERSISTENCE_LAYER.md` - Database documentation
- `PHASE_5_SUMMARY.md` - API phase summary
- `PHASE_6_SUMMARY.md` - Connector phase summary

**Testing**:
- `test-connectors.js` - Connector tests
- `test-api.js` - API tests
- `test-integration.js` - End-to-end tests
- `test-persistence.js` - Database tests

**Scripts**:
- `npm start` - Start backend
- `node start-connectors.js` - Start connectors
- `node test-*.js` - Run tests

---

## Summary

**System is production-ready with**:
- ✓ Complete REST API layer
- ✓ Connector abstraction layer
- ✓ Telegram integration
- ✓ Persistent storage (Prisma + SQLite/PostgreSQL)
- ✓ AI-powered workflow orchestration
- ✓ Comprehensive testing
- ✓ Monitoring and metrics
- ✓ Health checks
- ✓ Graceful shutdown
- ✓ Error handling
- ✓ Audit logging

**Ready for**:
- ✓ Production deployment
- ✓ WhatsApp integration
- ✓ Dashboard development
- ✓ Real ERP integration
- ✓ Scaling

---

**Deployment Status**: Ready for Production ✅

