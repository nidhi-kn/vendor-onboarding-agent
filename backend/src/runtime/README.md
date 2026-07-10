# Workflow Runtime - Phase 2

Orchestration layer that coordinates the complete workflow lifecycle.

## Architecture

```
WorkflowEvent
    ↓
WorkflowRuntime (Orchestrator)
    ↓
WorkflowContextBuilder → Build PlannerRequest
    ↓
PlannerInvoker → Call existing Planner
    ↓
PlannerValidator → Validate response
    ↓
WorkflowStateMachine → Validate transitions
    ↓
WorkflowDispatcher → Prepare ExecutionPlan
    ↓
WorkflowResult (ready for Phase 3)
```

## Files

### `workflowRuntime.js` - Main Orchestrator
**Responsibilities:**
- Accept WorkflowEvent
- Coordinate all components
- Return WorkflowResult

**Flow:**
1. Build context
2. Invoke planner
3. Validate response
4. Validate state transition
5. Dispatch execution plan
6. Return result

**Does NOT:**
- Execute tools
- Access database
- Send messages

### `workflowContextBuilder.js` - Context Preparation
**Responsibilities:**
- Load vendor (mocked for now)
- Load workflow (mocked for now)
- Load conversation (mocked for now)
- Load documents (mocked for now)
- Build complete PlannerRequest

**Future:** Replace mocked methods with repository calls

**Interface:**
```javascript
async buildPlannerInput(workflowEvent) → PlannerRequest
```

### `plannerInvoker.js` - Planner Wrapper
**Responsibilities:**
- Invoke existing planner.js
- Handle retries (2 attempts)
- Handle timeout (45 seconds)
- Surface errors

**Why:** Runtime never calls planner directly

### `plannerValidator.js` - Response Validation
**Responsibilities:**
- Validate using existing plannerSchema
- Additional quality checks
- Calculate confidence score

**Returns:**
```javascript
{
  success: boolean,
  data: PlannerResponse,
  errors: [],
  confidenceScore: 0-100
}
```

### `workflowStateMachine.js` - State Management
**Responsibilities:**
- Validate state transitions
- Get allowed next states
- Configuration-driven (uses VALID_TRANSITIONS)

**Methods:**
```javascript
isValidTransition(current, next) → boolean
getNextAllowedStates(current) → string[]
validateTransition(current, next) → ValidationResult
```

### `workflowDispatcher.js` - Execution Planning
**Responsibilities:**
- Convert PlannerResponse → ExecutionPlan
- Prepare tool execution tasks
- Assign priorities

**Does NOT execute tools**

**Returns:**
```javascript
{
  currentState,
  nextState,
  confidence,
  responseMessage,
  executionTasks: [
    {
      tool,
      action,
      args,
      priority,
      taskId
    }
  ]
}
```

## Data Flow

### Input: WorkflowEvent
```javascript
{
  workflowId: 'wf_123',
  trigger: 'message_received',
  incomingMessage: {
    messageType: 'text',
    content: 'Hello',
    senderId: 'v_123',
    senderName: 'John Doe',
    timestamp: Date
  }
}
```

### Output: WorkflowResult
```javascript
{
  status: 'success',
  currentState: 'WAITING_GST',
  nextState: 'WAITING_PAN',
  plannerResponse: {
    reasoning: '...',
    decision: {...},
    toolCalls: [...],
    responseMessage: '...'
  },
  executionPlan: {
    executionTasks: [
      {
        tool: 'document',
        action: 'save',
        args: {...},
        priority: 'normal',
        taskId: 'task_123'
      }
    ]
  },
  metadata: {
    runtimeId: 'runtime_123',
    duration: 1234,
    timestamp: '...',
    validation: {
      confidence: 85,
      errors: []
    }
  }
}
```

## Usage

### Initialization
```javascript
const workflowRuntime = require('./runtime/workflowRuntime');

// Once at startup
workflowRuntime.initialize();
```

### Execute Event
```javascript
const workflowEvent = {
  workflowId: 'wf_001',
  trigger: 'message_received',
  incomingMessage: {
    messageType: 'text',
    content: 'I want to register',
    senderId: 'vendor_123'
  }
};

const result = await workflowRuntime.execute(workflowEvent);

if (result.status === 'success') {
  console.log('Current State:', result.currentState);
  console.log('Next State:', result.nextState);
  console.log('Tasks to execute:', result.executionPlan.executionTasks);
}
```

## Integration with Existing Planner

The runtime **integrates** with existing Planner Agent:
- Uses existing `planner.js`
- Uses existing `plannerSchema.js`
- Uses existing `constants.js` (WORKFLOW_STATES, VALID_TRANSITIONS)
- Does NOT modify planner code

## Logged Events

1. **RuntimeStarted** - Workflow event received
2. **ContextBuilt** - PlannerRequest prepared
3. **PlannerInvoked** - Planner called
4. **PlannerCompleted** - Planner responded
5. **PlannerValidated** - Response validated
6. **StateValidated** - Transition validated
7. **ExecutionPlanPrepared** - Tasks prepared
8. **RuntimeCompleted** - Success
9. **RuntimeFailed** - Error

## Design Decisions

### Why Separate Components?
- **Single Responsibility** - Each file does one thing
- **Testability** - Each component can be tested independently
- **Maintainability** - Easy to understand and modify
- **Extensibility** - Easy to add features

### Why Mocked Data?
- **Phase 2 Goal** - Build orchestration layer
- **Phase 4 Goal** - Build repositories and database
- **Interface Design** - Methods ready for repository replacement

### Why Not Execute Tools?
- **Phase 3 Responsibility** - Tool Registry and Executor
- **Clear Separation** - Runtime orchestrates, Executor executes
- **Flexibility** - Can swap execution strategies

## Phase 3 Integration

Phase 3 will add:

```javascript
// runtime/workflowRuntime.js
// After dispatcher.dispatch()

const toolExecutor = require('../tools/toolExecutor');
const executionResult = await toolExecutor.execute(executionPlan);

return {
  ...workflowResult,
  executionResult
};
```

**No changes to existing runtime code required**

## Error Handling

### Planner Errors
- Retry 2 times
- Timeout after 45 seconds
- Surface error in WorkflowResult

### Validation Errors
- Return validation details
- Continue with low confidence
- Log errors

### State Transition Errors
- Fail immediately
- Return allowed states
- Prevent invalid transitions

## Testing

See `test-runtime.js` for complete example showing:
- Event input
- Runtime execution
- Planner invocation
- Validation
- State transition
- Execution plan output

## Future Enhancements (Post-Phase 3)

- Event sourcing
- Workflow history
- Rollback/compensation
- Parallel task execution
- Task dependencies
- Circuit breaker
- Rate limiting

---

**Status:** ✅ Complete and Ready for Phase 3  
**Integration:** Seamless with existing Planner  
**Next Phase:** Tool Registry + Tool Executor
