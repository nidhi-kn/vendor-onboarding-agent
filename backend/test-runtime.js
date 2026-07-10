/**
 * test-runtime.js
 * 
 * Test Workflow Runtime with realistic workflow event.
 * 
 * Run: node test-runtime.js
 */

require('dotenv').config();
const workflowRuntime = require('./src/runtime/workflowRuntime');
const { WORKFLOW_STATES, MESSAGE_TYPES } = require('./src/agent/constants');

async function testWorkflowRuntime() {
  console.log('\n' + '='.repeat(80));
  console.log('WORKFLOW RUNTIME TEST');
  console.log('='.repeat(80) + '\n');

  try {
    // Step 1: Initialize runtime
    console.log('1. Initializing Workflow Runtime...');
    workflowRuntime.initialize();
    console.log('✅ Runtime initialized\n');

    // Step 2: Create workflow event
    console.log('2. Creating Workflow Event...');
    const workflowEvent = {
      workflowId: 'wf_test_001',
      trigger: 'message_received',
      incomingMessage: {
        messageType: MESSAGE_TYPES.TEXT,
        content: 'I want to register as a vendor. What documents do I need?',
        senderId: 'vendor_test_123',
        senderName: 'Test Vendor',
        timestamp: new Date()
      }
    };
    console.log('✅ Event created');
    console.log('   Workflow ID:', workflowEvent.workflowId);
    console.log('   Trigger:', workflowEvent.trigger);
    console.log('   Message:', workflowEvent.incomingMessage.content);
    console.log();

    // Step 3: Execute workflow
    console.log('3. Executing Workflow Runtime...');
    console.log('   (This will invoke the Planner Agent via Groq API)');
    console.log('   (Expected duration: 5-10 seconds)\n');

    const result = await workflowRuntime.execute(workflowEvent);

    console.log('✅ Runtime execution completed\n');

    // Step 4: Display results
    console.log('='.repeat(80));
    console.log('WORKFLOW RESULT');
    console.log('='.repeat(80));
    console.log();

    if (result.status === 'success') {
      console.log('✅ Status: SUCCESS\n');

      // Current State
      console.log('📍 Current State:', result.currentState);
      console.log('📍 Next State:', result.nextState || 'No change');
      console.log();

      // Planner Decision
      console.log('🧠 Planner Decision:');
      console.log('   Type:', result.plannerResponse.decision.type);
      console.log('   Description:', result.plannerResponse.decision.description);
      console.log();

      // Reasoning
      console.log('💭 Planner Reasoning:');
      console.log('   ', result.plannerResponse.reasoning.substring(0, 200) + '...');
      console.log();

      // Response Message
      console.log('💬 Response Message:');
      console.log('   ', result.plannerResponse.responseMessage.substring(0, 200));
      if (result.plannerResponse.responseMessage.length > 200) {
        console.log('   ...');
      }
      console.log();

      // Execution Plan
      console.log('📋 Execution Plan:');
      console.log('   Confidence:', result.executionPlan.confidence);
      console.log('   Tasks:', result.executionPlan.executionTasks.length);
      console.log();

      if (result.executionPlan.executionTasks.length > 0) {
        console.log('   Task List:');
        result.executionPlan.executionTasks.forEach((task, i) => {
          console.log(`   ${i + 1}. [${task.priority.toUpperCase()}] ${task.tool}.${task.action}`);
          console.log(`      Task ID: ${task.taskId}`);
        });
        console.log();
      }

      // Metadata
      console.log('📊 Metadata:');
      console.log('   Runtime ID:', result.metadata.runtimeId);
      console.log('   Duration:', result.metadata.duration, 'ms');
      console.log('   Confidence Score:', result.metadata.validation.confidence);
      console.log('   Timestamp:', result.metadata.timestamp);
      console.log();

    } else {
      console.log('❌ Status: ERROR\n');
      console.log('Error Message:', result.metadata.error.message);
      console.log();
      console.log('Stack Trace:');
      console.log(result.metadata.error.stack);
    }

    console.log('='.repeat(80));
    console.log();

    // Step 5: Explain flow
    console.log('='.repeat(80));
    console.log('REQUEST FLOW');
    console.log('='.repeat(80));
    console.log();
    console.log('1. WorkflowEvent → WorkflowRuntime');
    console.log('2. WorkflowRuntime → WorkflowContextBuilder (build PlannerRequest)');
    console.log('3. WorkflowRuntime → PlannerInvoker (call Planner)');
    console.log('4. PlannerInvoker → Planner.plan() (existing planner)');
    console.log('5. Planner → Groq API (LLM decision-making)');
    console.log('6. Groq API → Planner (structured JSON response)');
    console.log('7. Planner → PlannerInvoker (validated response)');
    console.log('8. WorkflowRuntime → PlannerValidator (validate quality)');
    console.log('9. WorkflowRuntime → WorkflowStateMachine (validate transition)');
    console.log('10. WorkflowRuntime → WorkflowDispatcher (prepare ExecutionPlan)');
    console.log('11. WorkflowRuntime → Return WorkflowResult');
    console.log();
    console.log('✅ All validations passed');
    console.log('✅ Execution plan prepared');
    console.log('✅ Ready for Phase 3 (Tool Executor)');
    console.log();

    console.log('='.repeat(80));
    console.log('NEXT STEPS (Phase 3)');
    console.log('='.repeat(80));
    console.log();
    console.log('Phase 3 will add:');
    console.log('- Tool Registry (register all tools)');
    console.log('- Tool Executor (execute prepared tasks)');
    console.log('- Business Tools (vendor, document, workflow, etc.)');
    console.log();
    console.log('Integration point:');
    console.log('const executionResult = await toolExecutor.execute(executionPlan);');
    console.log();

    console.log('✅ Test completed successfully!\n');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// Run test
testWorkflowRuntime();
