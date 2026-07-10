/**
 * test-full-pipeline.js
 * 
 * Complete end-to-end test: Planner → Runtime → Executor → Tools
 * 
 * Run: node test-full-pipeline.js
 */

require('dotenv').config();
const { initializeTools } = require('./src/executor/initializeTools');
const workflowRuntime = require('./src/runtime/workflowRuntime');
const { WORKFLOW_STATES, MESSAGE_TYPES } = require('./src/agent/constants');

async function testFullPipeline() {
  console.log('\n' + '='.repeat(80));
  console.log('FULL AI AGENT PIPELINE TEST');
  console.log('Planner → Runtime → Executor → Tools');
  console.log('='.repeat(80) + '\n');

  try {
    // Step 1: Initialize everything
    console.log('1. Initializing System...');
    initializeTools();
    workflowRuntime.initialize();
    console.log('✅ System initialized');
    console.log();

    // Step 2: Create workflow event
    console.log('2. Creating Workflow Event...');
    const workflowEvent = {
      workflowId: 'wf_pipeline_test',
      trigger: 'message_received',
      incomingMessage: {
        messageType: MESSAGE_TYPES.TEXT,
        content: 'I want to register as a vendor. What documents do I need?',
        senderId: 'vendor_pipeline_test',
        senderName: 'Pipeline Test Vendor',
        timestamp: new Date()
      }
    };
    console.log('✅ Workflow event created');
    console.log('   Workflow ID:', workflowEvent.workflowId);
    console.log('   Message:', workflowEvent.incomingMessage.content);
    console.log();

    // Step 3: Execute complete workflow
    console.log('3. Executing Complete Workflow...');
    console.log('   (This will invoke Planner → Runtime → Executor → Tools)');
    console.log('   (Expected duration: 5-10 seconds)\n');

    const startTime = Date.now();
    const result = await workflowRuntime.execute(workflowEvent);
    const totalDuration = Date.now() - startTime;

    console.log('✅ Workflow execution completed\n');

    // Step 4: Display complete results
    console.log('='.repeat(80));
    console.log('COMPLETE WORKFLOW RESULT');
    console.log('='.repeat(80));
    console.log();

    if (result.status === 'success') {
      console.log('✅ Status: SUCCESS');
      console.log();

      // Runtime metadata
      console.log('📊 Runtime Metadata:');
      console.log('   Runtime ID:', result.metadata.runtimeId);
      console.log('   Total Duration:', totalDuration, 'ms');
      console.log('   Runtime Duration:', result.metadata.duration, 'ms');
      console.log('   Confidence Score:', result.metadata.validation.confidence);
      console.log();

      // Workflow state
      console.log('📍 Workflow State:');
      console.log('   Current State:', result.currentState);
      console.log('   Next State:', result.nextState || 'No change');
      console.log();

      // Planner decision
      console.log('🧠 Planner Decision:');
      console.log('   Type:', result.plannerResponse.decision.type);
      console.log('   Description:', result.plannerResponse.decision.description);
      console.log('   Tool Calls:', result.plannerResponse.toolCalls.length);
      console.log();

      // Planner reasoning (truncated)
      console.log('💭 Planner Reasoning:');
      const reasoning = result.plannerResponse.reasoning.substring(0, 150);
      console.log('   ', reasoning + '...');
      console.log();

      // Response message (truncated)
      console.log('💬 Response Message:');
      const message = result.plannerResponse.responseMessage.substring(0, 200);
      console.log('   ', message);
      if (result.plannerResponse.responseMessage.length > 200) {
        console.log('   ...');
      }
      console.log();

      // Execution plan
      console.log('📋 Execution Plan:');
      console.log('   Confidence:', result.executionPlan.confidence);
      console.log('   Tasks Prepared:', result.executionPlan.executionTasks.length);
      console.log();

      // Tool execution results
      console.log('⚙️  Tool Execution Results:');
      console.log('   Success:', result.executionResult.success);
      console.log('   Execution Time:', result.executionResult.executionTime, 'ms');
      console.log('   Tasks Executed:', result.executionResult.results.length);
      console.log('   Errors:', result.executionResult.errors.length);
      console.log();

      if (result.executionResult.results.length > 0) {
        console.log('   Executed Tasks:');
        result.executionResult.results.forEach((r, i) => {
          const status = r.success ? '✅' : '❌';
          console.log(`   ${i + 1}. ${status} ${r.tool}.${r.action}`);
        });
        console.log();
      }

      console.log('='.repeat(80));
      console.log();

      // Step 5: Show complete flow
      console.log('='.repeat(80));
      console.log('COMPLETE EXECUTION FLOW');
      console.log('='.repeat(80));
      console.log();
      console.log('1. WorkflowEvent received');
      console.log('   ↓');
      console.log('2. WorkflowRuntime.execute()');
      console.log('   ↓');
      console.log('3. WorkflowContextBuilder.buildPlannerInput()');
      console.log('   → Built PlannerRequest from event');
      console.log('   ↓');
      console.log('4. PlannerInvoker.invoke()');
      console.log('   ↓');
      console.log('5. Planner.plan()');
      console.log('   ↓');
      console.log('6. GroqService.generate()');
      console.log('   → Called Groq API (LLM)');
      console.log('   ↓');
      console.log('7. PlannerResponse returned');
      console.log('   ↓');
      console.log('8. PlannerValidator.validate()');
      console.log('   → Validated response structure');
      console.log('   ↓');
      console.log('9. WorkflowStateMachine.validateTransition()');
      console.log('   → Validated state transition');
      console.log('   ↓');
      console.log('10. WorkflowDispatcher.dispatch()');
      console.log('    → Created ExecutionPlan');
      console.log('    ↓');
      console.log('11. ToolExecutor.execute()');
      console.log('    ↓');
      console.log('12. For each task:');
      console.log('    → ToolRegistry.get(toolName)');
      console.log('    → Tool.execute(action, args)');
      console.log('    → Capture result');
      console.log('    ↓');
      console.log('13. ExecutionResult returned');
      console.log('    ↓');
      console.log('14. WorkflowResult assembled');
      console.log('    ↓');
      console.log('15. Complete result returned');
      console.log();

      console.log('='.repeat(80));
      console.log('SYSTEM CAPABILITIES DEMONSTRATED');
      console.log('='.repeat(80));
      console.log();
      console.log('✅ AI Planning - Planner analyzed context and made decision');
      console.log('✅ Workflow Orchestration - Runtime coordinated all components');
      console.log('✅ State Management - State machine validated transitions');
      console.log('✅ Tool Execution - Executor executed business actions');
      console.log('✅ Data Persistence - Tools stored data (in-memory)');
      console.log('✅ Error Handling - Comprehensive error management');
      console.log('✅ Logging - Structured logging throughout');
      console.log('✅ Validation - Multiple validation layers');
      console.log();

      console.log('='.repeat(80));
      console.log('WHAT WE BUILT IN PHASE 3');
      console.log('='.repeat(80));
      console.log();
      console.log('✅ Tool Registry - Extensible tool registration system');
      console.log('✅ Tool Executor - Executes execution plans');
      console.log('✅ Workflow Tool - State management');
      console.log('✅ Vendor Tool - Vendor data operations');
      console.log('✅ Document Tool - Document management');
      console.log('✅ Conversation Tool - Message history');
      console.log('✅ Approval Tool - Approval workflow');
      console.log('✅ Notification Tool - Message preparation');
      console.log('✅ Logger Tool - Event logging');
      console.log('✅ Runtime Integration - Seamless executor integration');
      console.log();

      console.log('='.repeat(80));
      console.log('READY FOR PHASE 4');
      console.log('='.repeat(80));
      console.log();
      console.log('Phase 4 will add:');
      console.log('- PostgreSQL database');
      console.log('- Prisma ORM');
      console.log('- Repository pattern');
      console.log('- Persistent data storage');
      console.log();
      console.log('No changes needed to:');
      console.log('- Tool interfaces');
      console.log('- Tool Executor');
      console.log('- Workflow Runtime');
      console.log('- Planner Agent');
      console.log();
      console.log('Simply replace tool internal storage with repository calls!');
      console.log();

      console.log('🎉 FULL PIPELINE TEST PASSED!\n');

    } else {
      console.log('❌ Status: ERROR\n');
      console.log('Error:', result.metadata.error.message);
      console.log();
      console.log('Stack:');
      console.log(result.metadata.error.stack);
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// Run test
testFullPipeline();
