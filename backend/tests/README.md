# Planner Agent Testing Suite

Comprehensive test suite for validating Planner Agent behavior across different workflow scenarios.

## Overview

This test suite ensures the Planner Agent:
- Returns valid JSON responses
- Adheres to schema constraints
- Makes correct decisions at each workflow stage
- Never violates critical business rules
- Maintains workflow integrity

## Files

### `sampleInputs.js`
Contains 5 realistic PlannerRequest examples covering different workflow stages:

1. **Case 1: WAITING_GST** - Vendor needs to upload GST certificate
2. **Case 2: GST Uploaded** - GST just uploaded, need PAN
3. **Case 3: GST + PAN Uploaded** - Two documents uploaded, need bank proof
4. **Case 4: All Documents Uploaded** - All docs ready for verification
5. **Case 5: Waiting Finance Approval** - Vendor asking about approval status

### `planner.test.js`
Main test file that:
- Runs all 5 test cases
- Validates JSON structure
- Validates Zod schemas
- Checks business rules
- Verifies critical constraints
- Prints detailed results

## Running Tests

### Prerequisites

1. **Groq API Key**: Add your API key to `.env`:
   ```bash
   GROQ_API_KEY=your_actual_api_key_here
   ```

2. **Dependencies**: Ensure all packages are installed:
   ```bash
   npm install
   ```

### Run All Tests

```bash
cd backend
node tests/planner.test.js
```

### Expected Runtime

- **Duration**: 30-60 seconds (5 API calls to Groq)
- **Output**: Detailed logs for each test case
- **Exit Code**: 0 if all pass, 1 if any fail

## What Gets Tested

### 1. JSON Validity
- Response is valid JSON
- Can be parsed without errors

### 2. Schema Validation
- Matches `PlannerResponseSchema` from Zod
- All required fields present
- Correct data types

### 3. Required Fields
- `reasoning` - At least 10 characters
- `decision` - Valid decision type
- `toolCalls` - Array (can be empty)
- `responseMessage` - Non-empty string
- `nextState` - Valid state or null
- `metadata` - Contains timestamp

### 4. Critical Constraints

#### ❌ Planner NEVER:
- Approves vendors directly
- Calls unknown tools
- Returns invalid states
- Skips workflow stages

#### ✅ Planner ALWAYS:
- Returns structured JSON
- Provides reasoning
- Uses valid tool types
- Maintains workflow integrity

### 5. Business Logic
- Correct decision types for each state
- Appropriate tool calls
- Logical state transitions
- Professional response messages

## Test Output

### Success Example
```
================================================================================
TEST CASE: Case 1: Vendor Waiting for GST Upload
================================================================================
State: WAITING_GST
Message: What documents do I need to provide?
Documents: 0

✓ Test 1: Response is valid JSON
✓ Test 2: Schema validation passed
✓ Test 3: Reasoning provided
✓ Test 4: Decision provided
✓ Test 5: Tool calls are array
✓ Test 6: Response message provided
✓ Test 7: Planner does not approve directly
✓ Test 8: All tools are known
✓ Test 9: Decision type is valid
✓ Test 10: Next state is valid

--------------------------------------------------------------------------------
PLANNER RESPONSE SUMMARY
--------------------------------------------------------------------------------
Reasoning: Vendor is in WAITING_GST state and asking about required documents...

Decision Type: REQUEST_DOCUMENT
Decision Description: Request vendor to upload GST certificate

Tool Calls (2):
  1. conversation.save_message
  2. logger.log_event

Response Message: You need to upload your GST certificate...
Next State: No change
--------------------------------------------------------------------------------

✅ Case 1: Vendor Waiting for GST Upload PASSED
```

### Final Summary
```
================================================================================
TEST SUMMARY
================================================================================
Total Tests: 5
Passed: 5
Failed: 0
================================================================================
✅ Case 1: Vendor Waiting for GST Upload
✅ Case 2: GST Certificate Uploaded
✅ Case 3: GST and PAN Uploaded
✅ Case 4: All Documents Uploaded
✅ Case 5: Waiting for Finance Approval
================================================================================

================================================================================
CRITICAL CHECKS (Must NEVER happen)
================================================================================
✓ Planner never approved vendor directly
✓ Planner never used unknown tools
✓ Planner never returned invalid JSON
✓ Planner never skipped workflow states
================================================================================

🎉 All tests passed successfully!
```

## Understanding Test Results

### Each Test Case Shows:

1. **Test Execution**
   - Current workflow state
   - Incoming message
   - Number of documents

2. **Validation Steps**
   - JSON validity ✓
   - Schema compliance ✓
   - Required fields ✓
   - Critical constraints ✓

3. **Response Summary**
   - Planner's reasoning
   - Decision made
   - Tools called
   - Response message
   - State transition

4. **Expected Behavior**
   - What should happen
   - Whether it matched

## Adding New Test Cases

To add a new test case:

1. **Create input in `sampleInputs.js`**:
   ```javascript
   const caseN_Description = {
     vendorContext: {...},
     workflowContext: {...},
     documents: [...],
     conversationHistory: [...],
     incomingMessage: {...}
   };
   ```

2. **Export it**:
   ```javascript
   module.exports = {
     // ... existing cases
     caseN_Description
   };
   ```

3. **Add test in `planner.test.js`**:
   ```javascript
   await runTestCase(
     'Case N: Description',
     caseN_Description,
     {
       // Expected behavior
     }
   );
   ```

## Debugging Failed Tests

### Issue: Schema Validation Failed
**Check**: Response structure matches `PlannerResponseSchema`
```javascript
const validation = validatePlannerResponse(response);
console.log(validation.error.details);
```

### Issue: Unknown Tools Used
**Check**: Tool names match `TOOL_TYPES` constants
```javascript
console.log('Valid tools:', Object.values(TOOL_TYPES));
console.log('Used tools:', response.toolCalls.map(tc => tc.tool));
```

### Issue: Invalid State Transition
**Check**: Next state is in `WORKFLOW_STATES`
```javascript
console.log('Valid states:', Object.values(WORKFLOW_STATES));
console.log('Next state:', response.nextState);
```

### Issue: API Rate Limit
**Solution**: Add delay between tests
```javascript
await new Promise(resolve => setTimeout(resolve, 2000)); // 2s delay
```

## Critical Rules Enforced

### Rule 1: No Direct Approvals
The Planner must NEVER call `approval.approve()` directly.
Only human approvers can approve vendors.

**Test**:
```javascript
const hasApprovalTool = response.toolCalls.some(
  tc => tc.tool === 'approval' && tc.action === 'approve'
);
if (hasApprovalTool) {
  throw new Error('CRITICAL: Planner tried to approve directly!');
}
```

### Rule 2: Known Tools Only
All tool calls must use tools defined in `TOOL_TYPES`.

**Test**:
```javascript
const validTools = Object.values(TOOL_TYPES);
const unknownTools = response.toolCalls.filter(
  tc => !validTools.includes(tc.tool)
);
```

### Rule 3: Valid State Transitions
If state transition requested, must be a valid `WORKFLOW_STATES` value.

**Test**:
```javascript
if (response.nextState) {
  const validStates = Object.values(WORKFLOW_STATES);
  if (!validStates.includes(response.nextState)) {
    throw new Error('Invalid state');
  }
}
```

### Rule 4: Valid JSON Always
Response must always be parseable JSON.

**Test**:
```javascript
try {
  JSON.parse(rawResponse);
} catch (e) {
  throw new Error('Invalid JSON');
}
```

## Performance Benchmarks

| Test Case | Expected Duration | API Calls |
|-----------|------------------|-----------|
| Case 1 | 3-5 seconds | 1 |
| Case 2 | 3-5 seconds | 1 |
| Case 3 | 3-5 seconds | 1 |
| Case 4 | 3-5 seconds | 1 |
| Case 5 | 3-5 seconds | 1 |
| **Total** | **15-25 seconds** | **5** |

## Integration with CI/CD

### GitHub Actions Example
```yaml
- name: Test Planner Agent
  run: |
    cd backend
    node tests/planner.test.js
  env:
    GROQ_API_KEY: ${{ secrets.GROQ_API_KEY }}
```

### Pre-commit Hook
```bash
#!/bin/bash
cd backend
node tests/planner.test.js
if [ $? -ne 0 ]; then
  echo "Planner tests failed. Commit aborted."
  exit 1
fi
```

## Troubleshooting

### Test hangs indefinitely
- **Cause**: Groq API timeout or network issue
- **Solution**: Check internet connection, verify API key

### All tests fail immediately
- **Cause**: Missing API key or initialization failure
- **Solution**: Verify `.env` file, check `GROQ_API_KEY`

### Intermittent failures
- **Cause**: Groq API rate limiting
- **Solution**: Add delays between tests or reduce test frequency

### Different responses each run
- **Cause**: AI non-determinism (expected behavior)
- **Solution**: Tests validate structure, not exact content

## What This Test Suite Does NOT Test

- Database operations (no DB in Planner)
- Tool execution (Planner only requests tools)
- Telegram integration (not Planner's responsibility)
- API endpoints (tested separately)
- Actual document validation (Planner only decides)

## Next Steps

After these tests pass:
1. Build Tool System
2. Build Workflow Engine (executes tool calls)
3. Add integration tests (Planner + Tools + Workflow)
4. Add end-to-end tests (Full flow)

---

**Status**: ✅ Test Suite Complete  
**Coverage**: 5 workflow scenarios  
**Validation**: JSON, Schema, Business Rules  
**Runtime**: ~30 seconds
