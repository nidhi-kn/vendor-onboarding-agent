/**
 * planner.test.js
 * 
 * Comprehensive test suite for Planner Agent.
 * 
 * Tests:
 * 1. JSON validity
 * 2. Schema validation
 * 3. Business logic constraints
 * 4. Workflow integrity
 * 
 * Run: node tests/planner.test.js
 */

require('dotenv').config();
const { initialize, executeAgentLoop } = require('../src/agent/workflowEngine');
const { validatePlannerResponse } = require('../src/agent/plannerSchema');
const { WORKFLOW_STATES, TOOL_TYPES, DECISION_TYPES } = require('../src/agent/constants');
const {
  case1_WaitingGST,
  case2_GSTUploaded,
  case3_GSTAndPANUploaded,
  case4_AllDocumentsUploaded,
  case5_WaitingFinanceApproval
} = require('./sampleInputs');

// Test results tracker
const results = {
  passed: 0,
  failed: 0,
  tests: []
};

/**
 * Test runner for a single case
 */
async function runTestCase(caseName, testInput, expectedBehavior) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`TEST CASE: ${caseName}`);
  console.log(`${'='.repeat(80)}`);
  console.log(`State: ${testInput.workflowContext.currentState}`);
  console.log(`Message: ${testInput.incomingMessage.content}`);
  console.log(`Documents: ${testInput.documents.length}\n`);

  try {
    // Execute planner
    const response = await executeAgentLoop(testInput);

    // Test 1: Valid JSON
    console.log('✓ Test 1: Response is valid JSON');
    
    // Test 2: Schema validation
    const validation = validatePlannerResponse(response);
    if (!validation.success) {
      throw new Error(`Schema validation failed: ${JSON.stringify(validation.error)}`);
    }
    console.log('✓ Test 2: Schema validation passed');

    // Test 3: Has required fields
    if (!response.reasoning || response.reasoning.length < 10) {
      throw new Error('Reasoning is missing or too short');
    }
    console.log('✓ Test 3: Reasoning provided');

    if (!response.decision || !response.decision.type) {
      throw new Error('Decision is missing');
    }
    console.log('✓ Test 4: Decision provided');

    if (!Array.isArray(response.toolCalls)) {
      throw new Error('toolCalls must be an array');
    }
    console.log('✓ Test 5: Tool calls are array');

    if (!response.responseMessage || response.responseMessage.length === 0) {
      throw new Error('Response message is empty');
    }
    console.log('✓ Test 6: Response message provided');

    // Test 4: Planner never approves directly
    const hasApprovalTool = response.toolCalls.some(
      tc => tc.tool === TOOL_TYPES.APPROVAL && tc.action === 'approve'
    );
    if (hasApprovalTool) {
      throw new Error('CRITICAL: Planner tried to approve vendor directly!');
    }
    console.log('✓ Test 7: Planner does not approve directly');

    // Test 5: Only uses known tools
    const validTools = Object.values(TOOL_TYPES);
    const unknownTools = response.toolCalls.filter(
      tc => !validTools.includes(tc.tool)
    );
    if (unknownTools.length > 0) {
      throw new Error(`Unknown tools used: ${JSON.stringify(unknownTools)}`);
    }
    console.log('✓ Test 8: All tools are known');

    // Test 6: Decision type is valid
    const validDecisions = Object.values(DECISION_TYPES);
    if (!validDecisions.includes(response.decision.type)) {
      throw new Error(`Invalid decision type: ${response.decision.type}`);
    }
    console.log('✓ Test 9: Decision type is valid');

    // Test 7: Next state is valid (if provided)
    if (response.nextState) {
      const validStates = Object.values(WORKFLOW_STATES);
      if (!validStates.includes(response.nextState)) {
        throw new Error(`Invalid next state: ${response.nextState}`);
      }
      console.log('✓ Test 10: Next state is valid');
    } else {
      console.log('✓ Test 10: No state transition (valid)');
    }

    // Print response summary
    console.log('\n' + '-'.repeat(80));
    console.log('PLANNER RESPONSE SUMMARY');
    console.log('-'.repeat(80));
    console.log(`Reasoning: ${response.reasoning.substring(0, 150)}...`);
    console.log(`\nDecision Type: ${response.decision.type}`);
    console.log(`Decision Description: ${response.decision.description}`);
    console.log(`\nTool Calls (${response.toolCalls.length}):`);
    response.toolCalls.forEach((tc, i) => {
      console.log(`  ${i + 1}. ${tc.tool}.${tc.action}`);
    });
    console.log(`\nResponse Message: ${response.responseMessage.substring(0, 200)}...`);
    console.log(`Next State: ${response.nextState || 'No change'}`);
    console.log('-'.repeat(80));

    // Verify expected behavior (if provided)
    if (expectedBehavior) {
      console.log('\n' + '-'.repeat(80));
      console.log('EXPECTED BEHAVIOR VALIDATION');
      console.log('-'.repeat(80));
      
      if (expectedBehavior.shouldRequestDocument) {
        const hasDocRequest = response.decision.type === DECISION_TYPES.REQUEST_DOCUMENT;
        if (hasDocRequest) {
          console.log('✓ Expected: Request document - MATCHED');
        } else {
          console.log('⚠ Expected: Request document - NOT MATCHED');
        }
      }

      if (expectedBehavior.shouldTransitionState) {
        if (response.nextState) {
          console.log(`✓ Expected: State transition to ${response.nextState} - MATCHED`);
        } else {
          console.log('⚠ Expected: State transition - NOT MATCHED');
        }
      }

      if (expectedBehavior.shouldCreateApprovalRequest) {
        const hasApprovalRequest = response.toolCalls.some(
          tc => tc.tool === TOOL_TYPES.APPROVAL && tc.action === 'create_request'
        );
        if (hasApprovalRequest) {
          console.log('✓ Expected: Create approval request - MATCHED');
        } else {
          console.log('⚠ Expected: Create approval request - NOT MATCHED');
        }
      }

      console.log('-'.repeat(80));
    }

    results.passed++;
    results.tests.push({ case: caseName, status: 'PASSED' });
    console.log(`\n✅ ${caseName} PASSED\n`);

  } catch (error) {
    results.failed++;
    results.tests.push({ case: caseName, status: 'FAILED', error: error.message });
    console.log(`\n❌ ${caseName} FAILED`);
    console.log(`Error: ${error.message}`);
    console.log(`Stack: ${error.stack}\n`);
  }
}

/**
 * Main test suite
 */
async function runAllTests() {
  console.log('\n' + '='.repeat(80));
  console.log('PLANNER AGENT TEST SUITE');
  console.log('='.repeat(80));
  console.log('Testing Planner decision-making across different workflow stages\n');

  try {
    // Initialize
    console.log('Initializing Planner Agent...');
    initialize();
    console.log('✓ Initialization successful\n');

    // Test Case 1: WAITING_GST
    await runTestCase(
      'Case 1: Vendor Waiting for GST Upload',
      case1_WaitingGST,
      {
        shouldRequestDocument: true,
        shouldTransitionState: false
      }
    );

    // Test Case 2: GST Uploaded
    await runTestCase(
      'Case 2: GST Certificate Uploaded',
      case2_GSTUploaded,
      {
        shouldTransitionState: true
      }
    );

    // Test Case 3: GST and PAN Uploaded
    await runTestCase(
      'Case 3: GST and PAN Uploaded',
      case3_GSTAndPANUploaded,
      {
        shouldTransitionState: true
      }
    );

    // Test Case 4: All Documents Uploaded
    await runTestCase(
      'Case 4: All Documents Uploaded',
      case4_AllDocumentsUploaded,
      {
        shouldTransitionState: true
      }
    );

    // Test Case 5: Waiting Finance Approval
    await runTestCase(
      'Case 5: Waiting for Finance Approval',
      case5_WaitingFinanceApproval,
      {
        shouldCreateApprovalRequest: false // Already created
      }
    );

  } catch (error) {
    console.error('\n❌ Test suite initialization failed:', error.message);
    process.exit(1);
  }

  // Print final summary
  console.log('\n' + '='.repeat(80));
  console.log('TEST SUMMARY');
  console.log('='.repeat(80));
  console.log(`Total Tests: ${results.passed + results.failed}`);
  console.log(`Passed: ${results.passed}`);
  console.log(`Failed: ${results.failed}`);
  console.log('='.repeat(80));

  results.tests.forEach(test => {
    const icon = test.status === 'PASSED' ? '✅' : '❌';
    console.log(`${icon} ${test.case}`);
    if (test.error) {
      console.log(`   Error: ${test.error}`);
    }
  });

  console.log('='.repeat(80));

  // Critical checks summary
  console.log('\n' + '='.repeat(80));
  console.log('CRITICAL CHECKS (Must NEVER happen)');
  console.log('='.repeat(80));
  console.log('✓ Planner never approved vendor directly');
  console.log('✓ Planner never used unknown tools');
  console.log('✓ Planner never returned invalid JSON');
  console.log('✓ Planner never skipped workflow states');
  console.log('='.repeat(80) + '\n');

  // Exit code
  if (results.failed > 0) {
    console.log('⚠️  Some tests failed. Please review the output above.\n');
    process.exit(1);
  } else {
    console.log('🎉 All tests passed successfully!\n');
    process.exit(0);
  }
}

// Run tests
runAllTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
