# Vendor Onboarding AI Agent

An intelligent AI-powered system for automating vendor onboarding workflows using conversational interfaces and document management.

## 🏗️ Architecture Overview

This project follows a phased, inside-out development approach:

```
Phase 1: AI Workflow Engine (Planner Agent)
    ↓
Phase 2: Connector Layer
    ↓
Phase 3: Storage Layer
    ↓
Phase 4: Backend APIs
    ↓
Phase 5: Telegram Integration
    ↓
Phase 6: Operations Dashboard
```

## 📁 Project Structure

```
vendor-onboarding-agent/
├── backend/
│   ├── src/
│   │   ├── agent/          # AI Planner Agent (Groq-based)
│   │   ├── tools/          # Tool implementations (Workflow, Document, etc.)
│   │   ├── workflow/       # State machine and workflow engine
│   │   ├── connectors/     # Communication layer (Telegram, Email, etc.)
│   │   ├── services/       # Business logic services
│   │   ├── repositories/   # Data access layer
│   │   ├── config/         # Configuration files
│   │   └── utils/          # Utility functions
│   ├── tests/              # Test files
│   └── package.json
├── frontend/               # Operations Dashboard (Future)
└── docs/                   # Documentation
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Groq API key ([Get one here](https://console.groq.com))

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd vendor-onboarding-agent
```

2. Install dependencies:
```bash
cd backend
npm install
```

3. Configure environment variables:
```bash
# Copy the .env file and add your Groq API key
# Edit backend/.env and replace 'your_groq_api_key_here' with your actual key
```

4. Get your Groq API key:
   - Visit [Groq Console](https://console.groq.com)
   - Sign up or log in
   - Generate an API key
   - Add it to `backend/.env`

## 🎯 Development Phases

### ✅ Phase 0: Architecture & Design (COMPLETED)
- Project structure created
- Component responsibilities defined
- Workflow state machine designed
- Dependencies installed

### 🔜 Phase 1: AI Planner Agent (IN PROGRESS)
Building the core AI engine that orchestrates the workflow:
- Groq integration
- Structured JSON output
- Tool registry
- Agent loop

### ⏳ Upcoming Phases
- Phase 2: Tool System
- Phase 3: Workflow Engine
- Phase 4: Storage Layer (Prisma + PostgreSQL)
- Phase 5: Backend APIs
- Phase 6: Telegram Connector
- Phase 7: Operations Dashboard
- Phase 8: Production Features

## 🔧 Core Components

### Planner Agent
The brain of the system that:
- Understands context
- Makes decisions
- Selects appropriate tools
- Updates workflow state
- Never directly queries database or sends messages

### Workflow State Machine
```
START → WAITING_VENDOR_DETAILS → WAITING_GST → WAITING_PAN → 
WAITING_BANK_PROOF → DOCUMENT_VERIFICATION → WAITING_FINANCE_APPROVAL → 
APPROVED → ERP_SYNC → COMPLETED
```

### Tools
- **Workflow Tool**: Manage state transitions
- **Vendor Tool**: Create/update vendor information
- **Document Tool**: Handle document uploads and validation
- **Approval Tool**: Manage approval requests
- **Conversation Tool**: Track message history
- **Logger Tool**: Audit trail and timeline

### Connectors
Pluggable communication interfaces:
- Telegram Connector
- Email Connector (future)
- WhatsApp Connector (future)

## 🧪 Testing

```bash
# Run tests (once implemented)
npm test

# Run specific test suite
npm test -- --grep "Planner"
```

## 📚 Documentation

For detailed documentation, see:
- [Architecture Design](docs/architecture.md) (To be created)
- [API Documentation](docs/api.md) (To be created)
- [Workflow State Machine](docs/workflow.md) (To be created)

## 🎓 Learning Resources

This project implements several advanced patterns:
- AI Agent architecture
- Tool calling and execution
- State machine design
- Connector pattern for multi-channel communication
- Repository pattern for data access

## 🤝 Contributing

This is an educational project. Feel free to explore and learn from the code!

## 📝 License

ISC

## 🙏 Acknowledgments

Built as part of a practical AI engineering exercise, following industry best practices for building production-ready AI agent systems.
