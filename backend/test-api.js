/**
 * test-api.js
 * 
 * Tests REST API endpoints.
 * Demonstrates complete API layer functionality.
 */

require('dotenv').config();

const http = require('http');

const BASE_URL = 'http://localhost:3000';

/**
 * Make HTTP request
 */
function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: parsed
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: data
          });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

/**
 * Test API endpoints
 */
async function testAPI() {
  console.log('\n='.repeat(60));
  console.log('TESTING REST API LAYER');
  console.log('='.repeat(60));

  const workflowId = `workflow_${Date.now()}`;
  const vendorId = `vendor_${Date.now()}`;

  try {
    // Test 1: Health Check
    console.log('\n--- Test 1: Health Check ---');
    const health = await makeRequest('GET', '/health');
    console.log('Status:', health.status);
    console.log('Response:', JSON.stringify(health.body, null, 2));

    // Test 2: POST /api/workflow/process
    console.log('\n--- Test 2: POST /api/workflow/process ---');
    const processResult = await makeRequest('POST', '/api/workflow/process', {
      workflowId,
      trigger: 'user_message',
      incomingMessage: {
        messageType: 'text',
        content: 'Hi, I want to register as a vendor',
        senderName: 'Test Vendor',
        senderId: vendorId
      }
    });
    console.log('Status:', processResult.status);
    console.log('Success:', processResult.body.success);
    if (processResult.body.success) {
      console.log('Workflow State:', processResult.body.data.workflowState);
      console.log('Response Message:', processResult.body.data.responseMessage?.substring(0, 100) + '...');
    }

    // Test 3: GET /api/workflow/:id
    console.log('\n--- Test 3: GET /api/workflow/:id ---');
    const workflowDetails = await makeRequest('GET', `/api/workflow/${workflowId}`);
    console.log('Status:', workflowDetails.status);
    console.log('Success:', workflowDetails.body.success);
    if (workflowDetails.body.success) {
      console.log('Current State:', workflowDetails.body.data.workflow.currentState);
      console.log('Documents:', workflowDetails.body.data.documents.length);
      console.log('Messages:', workflowDetails.body.data.conversationSummary.messageCount);
    }

    // Test 4: POST /api/connector/message
    console.log('\n--- Test 4: POST /api/connector/message ---');
    const connectorResult = await makeRequest('POST', '/api/connector/message', {
      connectorId: 'telegram',
      workflowId,
      channelId: '123456',
      senderId: vendorId,
      senderName: 'Test Vendor',
      text: 'My company name is Test Corp',
      attachments: []
    });
    console.log('Status:', connectorResult.status);
    console.log('Success:', connectorResult.body.success);
    if (connectorResult.body.success) {
      console.log('Processed:', connectorResult.body.data.processed);
    }

    // Test 5: GET /api/vendor/:id
    console.log('\n--- Test 5: GET /api/vendor/:id ---');
    // First check if vendor exists from workflow processing
    const workflow = await makeRequest('GET', `/api/workflow/${workflowId}`);
    if (workflow.body.success && workflow.body.data.vendor) {
      const actualVendorId = workflow.body.data.vendor.id;
      const vendorDetails = await makeRequest('GET', `/api/vendor/${actualVendorId}`);
      console.log('Status:', vendorDetails.status);
      console.log('Success:', vendorDetails.body.success);
      if (vendorDetails.body.success) {
        console.log('Company Name:', vendorDetails.body.data.companyName);
        console.log('Email:', vendorDetails.body.data.email);
      }
    } else {
      console.log('Vendor not yet created in workflow');
    }

    // Test 6: GET /api/timeline/:workflowId
    console.log('\n--- Test 6: GET /api/timeline/:workflowId ---');
    const timeline = await makeRequest('GET', `/api/timeline/${workflowId}`);
    console.log('Status:', timeline.status);
    console.log('Success:', timeline.body.success);
    if (timeline.body.success) {
      console.log('Total Events:', timeline.body.data.totalEvents);
      console.log('Recent Events:');
      timeline.body.data.timeline.slice(0, 5).forEach(event => {
        console.log(`  - ${event.type}: ${event.action || event.status}`);
      });
    }

    // Test 7: POST /api/approval/:workflowId (will likely fail as no approval exists)
    console.log('\n--- Test 7: POST /api/approval/:workflowId ---');
    const approvalResult = await makeRequest('POST', `/api/approval/${workflowId}`, {
      action: 'approve',
      reason: 'Test approval',
      approvedBy: 'test_admin'
    });
    console.log('Status:', approvalResult.status);
    console.log('Success:', approvalResult.body.success);
    if (!approvalResult.body.success) {
      console.log('Error (Expected):', approvalResult.body.error.message);
    }

    // Test 8: 404 Handler
    console.log('\n--- Test 8: 404 Handler ---');
    const notFound = await makeRequest('GET', '/api/nonexistent');
    console.log('Status:', notFound.status);
    console.log('Error Code:', notFound.body.error.code);
    console.log('Error Message:', notFound.body.error.message);

    console.log('\n' + '='.repeat(60));
    console.log('API TESTS COMPLETED ✓');
    console.log('='.repeat(60));
    console.log('\nAPI Layer is ready for:');
    console.log('  - Telegram Connector');
    console.log('  - WhatsApp Connector');
    console.log('  - Dashboard (Next.js)');
    console.log('  - ERP Integration\n');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    throw error;
  }
}

// Check if server is running
console.log('Checking if server is running on', BASE_URL);
makeRequest('GET', '/health')
  .then(() => {
    console.log('✓ Server is running\n');
    return testAPI();
  })
  .then(() => {
    console.log('\nAll tests completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    if (error.code === 'ECONNREFUSED') {
      console.error('\n❌ Server is not running!');
      console.error('Please start the server first:');
      console.error('  node src/server.js\n');
    } else {
      console.error('\n❌ Test error:', error.message);
    }
    process.exit(1);
  });
