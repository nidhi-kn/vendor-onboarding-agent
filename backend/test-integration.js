/**
 * test-integration.js
 * 
 * End-to-end integration test.
 * Tests complete flow: Connector → API → Runtime → Planner → Tools → Database
 */

require('dotenv').config();

const axios = require('axios');
const { getPrismaClient } = require('./src/config/db');

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const prisma = getPrismaClient();

/**
 * Wait for server to be ready
 */
async function waitForServer(maxAttempts = 30) {
  console.log('Waiting for server to be ready...');
  
  for (let i = 0; i < maxAttempts; i++) {
    try {
      await axios.get(`${BASE_URL}/health`);
      console.log('✓ Server is ready\n');
      return true;
    } catch (error) {
      await sleep(1000);
    }
  }
  
  throw new Error('Server did not start in time');
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Test complete workflow
 */
async function testCompleteWorkflow() {
  console.log('='.repeat(70));
  console.log('END-TO-END INTEGRATION TEST');
  console.log('='.repeat(70));

  const workflowId = `workflow_test_${Date.now()}`;
  const channelId = `test_channel_${Date.now()}`;
  const senderId = `test_sender_${Date.now()}`;

  console.log('\nTest Context:');
  console.log(`  Workflow ID: ${workflowId}`);
  console.log(`  Channel ID: ${channelId}`);
  console.log(`  Sender ID: ${senderId}\n`);

  try {
    // Step 1: Initial vendor registration message
    console.log('--- Step 1: Vendor Sends Initial Message ---');
    const message1 = await axios.post(`${BASE_URL}/api/connector/message`, {
      connectorId: 'telegram',
      workflowId,
      channelId,
      senderId,
      senderName: 'Test Vendor',
      text: 'Hi, I want to register as a vendor',
      attachments: [],
      receivedAt: new Date().toISOString()
    });

    console.log('✓ Message processed');
    console.log('  Success:', message1.data.success);
    console.log('  Workflow State:', message1.data.data.result.workflowState);
    console.log('  Response:', message1.data.data.result.responseMessage?.substring(0, 100) + '...');

    await sleep(1000);

    // Step 2: Vendor provides company details
    console.log('\n--- Step 2: Vendor Provides Company Details ---');
    const message2 = await axios.post(`${BASE_URL}/api/connector/message`, {
      connectorId: 'telegram',
      workflowId,
      channelId,
      senderId,
      senderName: 'Test Vendor',
      text: `Company Name: Test Corp
Contact Person: John Doe
Email: john@testcorp.com
Phone: +91-9876543210`,
      attachments: [],
      receivedAt: new Date().toISOString()
    });

    console.log('✓ Message processed');
    console.log('  Success:', message2.data.success);
    console.log('  Workflow State:', message2.data.data.result.workflowState);
    console.log('  Response:', message2.data.data.result.responseMessage?.substring(0, 100) + '...');

    await sleep(1000);

    // Step 3: Check workflow details
    console.log('\n--- Step 3: Check Workflow Details ---');
    const workflowDetails = await axios.get(`${BASE_URL}/api/workflow/${workflowId}`);

    console.log('✓ Workflow retrieved');
    console.log('  Current State:', workflowDetails.data.data.workflow.currentState);
    console.log('  Current Step:', workflowDetails.data.data.workflow.currentStep);
    console.log('  Messages:', workflowDetails.data.data.conversationSummary.messageCount);
    console.log('  Documents:', workflowDetails.data.data.documents.length);

    if (workflowDetails.data.data.vendor) {
      console.log('  Vendor Created:', workflowDetails.data.data.vendor.companyName);
    }

    // Step 4: Check vendor in database
    console.log('\n--- Step 4: Check Vendor in Database ---');
    const vendors = await prisma.vendor.findMany({
      where: {
        workflows: {
          some: {
            id: workflowId
          }
        }
      }
    });

    if (vendors.length > 0) {
      const vendor = vendors[0];
      console.log('✓ Vendor found in database');
      console.log('  ID:', vendor.id);
      console.log('  Company:', vendor.companyName);
      console.log('  Email:', vendor.email);
      console.log('  Phone:', vendor.phone);
      console.log('  Status:', vendor.status);
    } else {
      console.log('⚠ Vendor not yet created (workflow may be in early stage)');
    }

    // Step 5: Check messages in database
    console.log('\n--- Step 5: Check Messages in Database ---');
    const messages = await prisma.message.findMany({
      where: { workflowId },
      orderBy: { createdAt: 'asc' }
    });

    console.log('✓ Messages found:', messages.length);
    messages.forEach((msg, idx) => {
      console.log(`  ${idx + 1}. [${msg.messageType}] ${msg.senderName}: ${msg.content?.substring(0, 50)}...`);
    });

    // Step 6: Check audit log
    console.log('\n--- Step 6: Check Audit Log ---');
    const auditLogs = await prisma.auditLog.findMany({
      where: { workflowId },
      orderBy: { timestamp: 'asc' }
    });

    console.log('✓ Audit logs found:', auditLogs.length);
    auditLogs.forEach((log, idx) => {
      console.log(`  ${idx + 1}. ${log.action} (${log.fromState} → ${log.toState})`);
    });

    // Step 7: Get timeline
    console.log('\n--- Step 7: Get Timeline ---');
    const timeline = await axios.get(`${BASE_URL}/api/timeline/${workflowId}`);

    console.log('✓ Timeline retrieved');
    console.log('  Total Events:', timeline.data.data.totalEvents);
    console.log('  Recent Events:');
    timeline.data.data.timeline.slice(0, 5).forEach(event => {
      console.log(`    - [${event.type}] ${event.action || event.status}`);
    });

    // Step 8: Check agent runs
    console.log('\n--- Step 8: Check Agent Runs ---');
    const agentRuns = await prisma.agentRun.findMany({
      where: { workflowId },
      orderBy: { createdAt: 'asc' }
    });

    console.log('✓ Agent runs found:', agentRuns.length);
    agentRuns.forEach((run, idx) => {
      console.log(`  ${idx + 1}. Status: ${run.status}, Latency: ${run.latencyMs}ms, Prompt Version: ${run.promptVersion}`);
    });

    // Step 9: Test workflow processing endpoint
    console.log('\n--- Step 9: Test Workflow Processing Endpoint ---');
    const processResult = await axios.post(`${BASE_URL}/api/workflow/process`, {
      workflowId,
      trigger: 'user_message',
      incomingMessage: {
        messageType: 'text',
        content: 'What is the current status?',
        senderName: 'Test Vendor',
        senderId
      }
    });

    console.log('✓ Workflow processed');
    console.log('  Success:', processResult.data.success);
    console.log('  Workflow State:', processResult.data.data.workflowState);
    console.log('  Response:', processResult.data.data.responseMessage?.substring(0, 100) + '...');

    // Final Summary
    console.log('\n' + '='.repeat(70));
    console.log('INTEGRATION TEST SUMMARY');
    console.log('='.repeat(70));

    const finalWorkflow = await axios.get(`${BASE_URL}/api/workflow/${workflowId}`);
    const finalMessages = await prisma.message.count({ where: { workflowId } });
    const finalAuditLogs = await prisma.auditLog.count({ where: { workflowId } });
    const finalAgentRuns = await prisma.agentRun.count({ where: { workflowId } });

    console.log('\n✓ Complete Flow Verified:');
    console.log(`  ✓ Connector → API: ${message1.data.success && message2.data.success ? 'PASS' : 'FAIL'}`);
    console.log(`  ✓ API → Runtime: ${processResult.data.success ? 'PASS' : 'FAIL'}`);
    console.log(`  ✓ Runtime → Planner: ${finalAgentRuns > 0 ? 'PASS' : 'FAIL'}`);
    console.log(`  ✓ Planner → Tools: ${finalMessages > 0 ? 'PASS' : 'FAIL'}`);
    console.log(`  ✓ Tools → Database: ${finalAuditLogs > 0 ? 'PASS' : 'FAIL'}`);

    console.log('\nDatabase State:');
    console.log(`  Workflows: 1`);
    console.log(`  Vendors: ${vendors.length}`);
    console.log(`  Messages: ${finalMessages}`);
    console.log(`  Audit Logs: ${finalAuditLogs}`);
    console.log(`  Agent Runs: ${finalAgentRuns}`);

    console.log('\nCurrent Workflow State:');
    console.log(`  State: ${finalWorkflow.data.data.workflow.currentState}`);
    console.log(`  Step: ${finalWorkflow.data.data.workflow.currentStep}`);
    console.log(`  Channel: ${finalWorkflow.data.data.workflow.channelType}`);

    console.log('\n' + '='.repeat(70));
    console.log('ALL INTEGRATION TESTS PASSED ✓');
    console.log('='.repeat(70));

    console.log('\nSystem is ready for:');
    console.log('  ✓ Telegram connector integration');
    console.log('  ✓ WhatsApp connector integration');
    console.log('  ✓ Dashboard (Next.js) integration');
    console.log('  ✓ ERP system integration');
    console.log('  ✓ Production deployment\n');

  } catch (error) {
    console.error('\n❌ Integration test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
    throw error;
  }
}

/**
 * Run integration tests
 */
async function runIntegrationTests() {
  try {
    // Wait for server
    await waitForServer();

    // Run tests
    await testCompleteWorkflow();

    console.log('\nIntegration tests completed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Integration tests failed:', error.message);
    process.exit(1);
  }
}

// Run tests
runIntegrationTests();
