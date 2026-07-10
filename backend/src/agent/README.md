# Planner Agent Architecture

This directory contains the foundational architecture for the **Planner Agent** - the brain of the vendor onboarding system.

## 📋 Overview

The Planner Agent is responsible for:
- Analyzing current workflow context (state, vendor info, documents, conversations)
- Making intelligent decisions about what should happen next
- Coordinating actions through tool calls
- Generating appropriate responses for vendors
- **NOT** executing actions directly - it only plans and requests

## 🏗️ Architecture Philosophy

The Planner follows the **"Brain vs Hands"** pattern:

```
Planner (Brain)          Tools (Hands)
     │                        │
     ├─ Analyzes              ├─ Executes
     ├─ Decides               ├─ Queries DB
     ├─ Requests              ├─ Sends Messages
     └─ Coordinates           └─ Performs Actions
```

**The Planner decides. Tools execute.**

This separation ensures:
- ✅ Clean architecture
- ✅ Testable components
- ✅ Easy to modify behavior
- ✅ Clear responsibilities
- ✅ Audit trail of decisions

## 📁 File Structure

### `constants.js`
**Purpose**: Central registry for all system constants.

**Contains**:
- `WORKFLOW_STATES`: All possible workflow states
- `VALID_TRANSITIONS`: Allowed state transitions
- `TOOL_TYPES`: Available tool categories
- `TOOL_ACTIONS`: Specific actions for each tool
- `DECISION_TYPES`: High-level decision categories
- `DOCUMENT_TYPES`: Required document types
- `MESSAGE_TYPES`: Message categories
- `ERROR_CODES`: Standard error codes

**When to use**: 
- Import when you need workflow states
- Reference for valid tool types
- Validate state transitions

**Example**:
```javascript
const { WORKFLOW_STATES, TOOL_TYPES } = require('./constants');

if (currentState === WORKFLOW_STATES.WAITING_GST) {
  // Request GST upload
}
```

---

### `plannerTypes.js`
**Purpose**: Type definitions for all Planner data structures.

**Contains**:
- `VendorContext`: Vendor information structure
- `WorkflowContext`: Workflow state and history
- `Document`: Document metadata structure
- `ConversationMessage`: Message in conversation history
- `IncomingMessage`: New message that triggers planning
- `PlannerRequest`: Complete input to Planner
- `PlannerResponse`: Planner's decision output
- `ToolCall`: Structure for requesting tool execution
- `Decision`: High-level decision structure

**When to use**:
- Understanding what data the Planner needs
- Building PlannerRequest objects
- Parsing PlannerResponse objects
- IDE autocomplete (via JSDoc)

**Example**:
```javascript
/**
 * @type {import('./plannerTypes').PlannerRequest}
 */
const request = {
  vendorContext: {...},
  workflowContext: {...},
  documents: [...],
  conversationHistory: [...],
  incomingMessage: {...}
};
```

---

### `plannerSchema.js`
**Purpose**: Runtime validation using Zod schemas.

**Contains**:
- `PlannerResponseSchema`: Validates complete Planner output
- `ToolCallSchema`: Validates individual tool calls
- `DecisionSchema`: Validates decision structure
- Validation helper functions

**When to use**:
- Validate Planner output before using it
- Catch malformed responses early
- Ensure type safety at runtime

**Example**:
```javascript
const { validatePlannerResponse } = require('./plannerSchema');

const response = await planner.plan(request);
const validation = validatePlannerResponse(response);

if (!validation.success) {
  console.error('Invalid response:', validation.error);
  return;
}

// Safe to use response
const { decision, toolCalls } = validation.data;
```

---

### `plannerPrompt.js`
**Purpose**: AI prompt that defines Planner behavior.

**Contains**:
- `PLANNER_SYSTEM_PROMPT`: Comprehensive system prompt
- `generateUserPrompt()`: Function to format context into prompt

**The prompt defines**:
- Planner's identity and role
- What it can and cannot do
- Expected output format
- Decision-making guidelines
- Example interactions

**When to use**:
- When implementing the Planner
- Sending requests to Groq/OpenAI
- Understanding Planner's behavior

**Example**:
```javascript
const { PLANNER_SYSTEM_PROMPT, generateUserPrompt } = require('./plannerPrompt');

const systemPrompt = PLANNER_SYSTEM_PROMPT;
const userPrompt = generateUserPrompt(plannerRequest);

// Send to AI model
const response = await groqService.generateStructuredResponse(
  systemPrompt,
  userPrompt
);
```

---

### `README.md` (this file)
**Purpose**: Documentation for the Planner Agent architecture.

## 🔄 How the Planner Works

### Input → Processing → Output Flow

```
1. INCOMING MESSAGE
   └─ Vendor sends message/document

2. CONTEXT GATHERING
   ├─ Load vendor information
   ├─ Load workflow state
   ├─ Load uploaded documents
   └─ Load conversation history

3. BUILD PLANNER REQUEST
   └─ Combine all context into PlannerRequest

4. GENERATE PROMPTS
   ├─ System prompt (who the Planner is)
   └─ User prompt (current context)

5. CALL AI MODEL (Groq)
   └─ Get structured JSON response

6. VALIDATE RESPONSE
   └─ Use Zod schemas to validate

7. EXECUTE TOOL CALLS
   ├─ For each tool call in response
   └─ Execute the corresponding tool

8. UPDATE STATE
   └─ If nextState is set, transition workflow

9. SEND RESPONSE
   └─ Send responseMessage to vendor
```

### Example Flow

**Scenario**: Vendor uploads GST certificate

```javascript
// 1. Context
const request = {
  vendorContext: { vendorId: 'v_123', companyName: 'Acme Corp' },
  workflowContext: { currentState: 'WAITING_GST' },
  documents: [],
  conversationHistory: [...],
  incomingMessage: { 
    messageType: 'document',
    content: 'Here is my GST certificate',
    documentUrl: 'https://...'
  }
};

// 2. Planner analyzes
const plannerResponse = await planner.plan(request);

// 3. Planner decides
{
  reasoning: 'Vendor uploaded document in WAITING_GST state...',
  decision: { type: 'VALIDATE_DOCUMENT' },
  toolCalls: [
    { tool: 'document', action: 'save', parameters: {...} },
    { tool: 'logger', action: 'log_event', parameters: {...} }
  ],
  responseMessage: 'Thank you! Next, upload your PAN card.',
  nextState: 'WAITING_PAN'
}

// 4. System executes
- Saves document to database
- Logs the event
- Transitions to WAITING_PAN
- Sends message to vendor
```

## 🎯 Key Design Principles

### 1. **Single Responsibility**
Each file has ONE job:
- `constants.js` → Define constants
- `plannerTypes.js` → Define types
- `plannerSchema.js` → Validate data
- `plannerPrompt.js` → Define AI behavior

### 2. **Separation of Concerns**
```
Planner → "What should happen?"
Tools → "Make it happen"
```

### 3. **Type Safety**
- JSDoc for development-time types
- Zod for runtime validation
- Both provide safety nets

### 4. **Extensibility**
Adding new features is easy:
- New state? Add to `WORKFLOW_STATES`
- New tool? Add to `TOOL_TYPES`
- New decision type? Add to `DECISION_TYPES`

### 5. **Testability**
Everything can be tested independently:
- Validate schemas with test data
- Test prompt generation
- Mock tool calls
- Test state transitions

## 🚀 Next Steps

After setting up these contracts, you'll build:

1. **Planner Implementation** (`planner.js`)
   - Uses `groqService.js` to call AI
   - Uses prompts from `plannerPrompt.js`
   - Validates output with `plannerSchema.js`

2. **Tool System** (`../tools/`)
   - Implement each tool type
   - Tools execute what Planner requests

3. **Workflow Engine** (`../workflow/`)
   - Orchestrates Planner + Tools
   - Manages state transitions

## 📚 Usage Examples

### Example 1: Validating a Response
```javascript
const { validatePlannerResponse } = require('./plannerSchema');

const response = {
  reasoning: 'Vendor needs to upload GST',
  decision: { type: 'REQUEST_DOCUMENT', description: 'Request GST' },
  toolCalls: [],
  responseMessage: 'Please upload GST certificate',
  nextState: null,
  metadata: { timestamp: new Date().toISOString() }
};

const result = validatePlannerResponse(response);
console.log(result.success); // true
```

### Example 2: Checking Valid Transitions
```javascript
const { WORKFLOW_STATES, VALID_TRANSITIONS } = require('./constants');

const currentState = WORKFLOW_STATES.WAITING_GST;
const nextState = WORKFLOW_STATES.WAITING_PAN;

if (VALID_TRANSITIONS[currentState].includes(nextState)) {
  console.log('Valid transition');
}
```

### Example 3: Generating Prompt
```javascript
const { generateUserPrompt } = require('./plannerPrompt');

const prompt = generateUserPrompt({
  vendorContext: {...},
  workflowContext: {...},
  documents: [...],
  conversationHistory: [...],
  incomingMessage: {...}
});

// Use prompt with AI model
```

## 🔍 Debugging Tips

### Problem: Planner makes wrong decisions
**Solution**: Review and update `plannerPrompt.js` system prompt

### Problem: Invalid response format
**Solution**: Check `plannerSchema.js` validation errors

### Problem: Invalid state transition
**Solution**: Check `VALID_TRANSITIONS` in `constants.js`

### Problem: Unknown tool type
**Solution**: Verify tool exists in `TOOL_TYPES` in `constants.js`

## 🎓 For Interviews

When discussing this architecture, highlight:

1. **Clean Separation**: Planner decides, tools execute
2. **Type Safety**: JSDoc + Zod for comprehensive validation
3. **Extensibility**: Easy to add states, tools, decisions
4. **Testability**: Each component can be tested independently
5. **Production-Ready**: Error handling, validation, clear contracts
6. **AI-Friendly**: Structured prompts guide consistent behavior

## 📞 Common Questions

**Q: Why separate types and schemas?**  
A: Types (JSDoc) provide IDE support during development. Schemas (Zod) provide runtime validation. Both are important.

**Q: Why not use TypeScript?**  
A: This project uses JavaScript for simplicity. The pattern translates directly to TypeScript.

**Q: Can the Planner call tools directly?**  
A: No. The Planner only REQUESTS tool calls. The workflow engine executes them.

**Q: How do I add a new workflow state?**  
A: 
1. Add to `WORKFLOW_STATES` in `constants.js`
2. Add transitions in `VALID_TRANSITIONS`
3. Update `plannerPrompt.js` with guidance for that state
4. Add to schema enum in `plannerSchema.js`

**Q: How do I add a new tool?**  
A:
1. Add to `TOOL_TYPES` in `constants.js`
2. Add actions in `TOOL_ACTIONS`
3. Update `plannerPrompt.js` to document the tool
4. Add to schema enum in `plannerSchema.js`
5. Implement the tool in `../tools/`

---

**Status**: ✅ Architecture Complete  
**Next Phase**: Implement Planner logic  
**Dependencies**: `groqService.js` (already created)
