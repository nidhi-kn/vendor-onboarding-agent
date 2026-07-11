/**
 * test-persistence.js
 * 
 * Demonstrates complete persistence layer with Prisma.
 * Tests all repositories and database-backed tools.
 */

require('dotenv').config();

// Repositories
const vendorRepository = require('./src/repositories/vendorRepository');
const workflowRepository = require('./src/repositories/workflowRepository');
const messageRepository = require('./src/repositories/messageRepository');
const documentRepository = require('./src/repositories/documentRepository');
const approvalRepository = require('./src/repositories/approvalRepository');
const agentRunRepository = require('./src/repositories/agentRunRepository');
const auditLogRepository = require('./src/repositories/auditLogRepository');

// Tools (now database-backed)
const vendorTool = require('./src/tools/vendorTool');
const workflowTool = require('./src/tools/workflowTool');
const documentTool = require('./src/tools/documentTool');
const conversationTool = require('./src/tools/conversationTool');
const approvalTool = require('./src/tools/approvalTool');
const loggerTool = require('./src/tools/loggerTool');

// Runtime
const workflowRuntime = require('./src/runtime/workflowRuntime');

// Database config
const { getPrismaClient, disconnectPrisma } = require('./src/config/db');

/**
 * Test Persistence Layer
 */
async function testPersistenceLayer() {
  console.log('\n='.repeat(60));
  console.log('TESTING PERSISTENCE LAYER WITH PRISMA');
  console.log('='.repeat(60));

  const vendorId = `vendor_${Date.now()}`;
  const workflowId = `workflow_${Date.now()}`;

  try {
    // Test 1: Create Vendor using Repository
    console.log('\n--- Test 1: Create Vendor (Repository) ---');
    const vendor = await vendorRepository.create({
      vendorId,
      companyName: 'Test Company Pvt Ltd',
      contactPerson: 'John Doe',
      email: 'john@testcompany.com',
      phone: '+91-9876543210'
    });
    console.log('✓ Vendor created:', {
      id: vendor.id,
      companyName: vendor.companyName,
      email: vendor.email
    });

    // Test 2: Create Workflow using Tool
    console.log('\n--- Test 2: Create Workflow (Tool) ---');
    const workflowResult = await workflowTool.execute('get_state', { workflowId });
    console.log('✓ Workflow created:', {
      workflowId: workflowResult.data.workflowId,
      currentState: workflowResult.data.currentState
    });

    // Test 3: Save Messages using Tool
    console.log('\n--- Test 3: Save Messages (Tool) ---');
    await conversationTool.execute('save_message', {
      workflowId,
      message: 'Hi, I want to register as a vendor',
      sender: 'vendor'
    });
    await conversationTool.execute('save_message', {
      workflowId,
      message: 'Welcome! Please provide your company details',
      sender: 'agent'
    });
    console.log('✓ Messages saved to database');

    // Test 4: Upload Documents using Tool
    console.log('\n--- Test 4: Upload Documents (Tool) ---');
    const gstDoc = await documentTool.execute('save', {
      workflowId,
      documentType: 'gst_certificate',
      fileName: 'gst_cert.pdf',
      fileUrl: 'https://storage.example.com/gst_cert.pdf'
    });
    const panDoc = await documentTool.execute('save', {
      workflowId,
      documentType: 'pan_card',
      fileName: 'pan_card.pdf',
      fileUrl: 'https://storage.example.com/pan_card.pdf'
    });
    console.log('✓ Documents uploaded:', {
      gst: gstDoc.data.id,
      pan: panDoc.data.id
    });

    // Test 5: Update Workflow State (Creates AuditLog)
    console.log('\n--- Test 5: Update Workflow State (Tool + AuditLog) ---');
    await workflowTool.execute('update_state', {
      workflowId,
      toState: 'WAITING_BANK_PROOF'
    });
    console.log('✓ Workflow state updated (audit log created automatically)');

    // Test 6: Create Approval Request
    console.log('\n--- Test 6: Create Approval Request (Tool) ---');
    const approvalResult = await approvalTool.execute('create_request', {
      workflowId,
      vendorId,
      requestedBy: 'agent'
    });
    console.log('✓ Approval request created:', {
      id: approvalResult.data.id,
      status: approvalResult.data.status
    });

    // Test 7: Log Event (Creates AuditLog)
    console.log('\n--- Test 7: Log Event (Tool) ---');
    await loggerTool.execute('log_event', {
      workflowId,
      event: 'document_verified',
      description: 'GST certificate verified successfully'
    });
    console.log('✓ Event logged to audit trail');

    // Test 8: Create AgentRun
    console.log('\n--- Test 8: Create AgentRun (Repository) ---');
    const agentRun = await agentRunRepository.create({
      workflowId,
      plannerInput: {
        vendorContext: { vendorId },
        workflowContext: { workflowId, currentState: 'WAITING_BANK_PROOF' }
      },
      status: 'success',
      reasoning: 'Vendor uploaded required documents',
      decision: { type: 'REQUEST_DOCUMENT' },
      toolCallsCount: 3,
      latencyMs: 1250
    });
    console.log('✓ AgentRun created:', {
      id: agentRun.id,
      status: agentRun.status,
      latencyMs: agentRun.latencyMs
    });

    // Test 9: Retrieve Complete Workflow with Relations
    console.log('\n--- Test 9: Retrieve Workflow (Repository) ---');
    const completeWorkflow = await workflowRepository.findById(workflowId);
    console.log('✓ Workflow retrieved with relations:', {
      id: completeWorkflow.id,
      currentState: completeWorkflow.currentState,
      messagesCount: completeWorkflow.messages.length,
      documentsCount: completeWorkflow.documents.length,
      vendor: completeWorkflow.vendor ? 'linked' : 'not linked'
    });

    // Test 10: Get Audit Trail
    console.log('\n--- Test 10: Get Audit Trail (Repository) ---');
    const auditTrail = await auditLogRepository.getAuditTrail(workflowId);
    console.log('✓ Audit trail retrieved:', {
      totalEvents: auditTrail.length,
      events: auditTrail.map(log => ({
        action: log.action,
        fromState: log.fromState,
        toState: log.toState,
        timestamp: log.timestamp.toISOString()
      }))
    });

    // Test 11: Get Conversation History
    console.log('\n--- Test 11: Get Conversation History (Tool) ---');
    const historyResult = await conversationTool.execute('get_history', {
      workflowId,
      limit: 10
    });
    console.log('✓ Conversation history retrieved:', {
      messagesCount: historyResult.data.length,
      messages: historyResult.data.map(m => ({
        sender: m.sender,
        content: m.content.substring(0, 30) + '...'
      }))
    });

    // Test 12: List Documents
    console.log('\n--- Test 12: List Documents (Tool) ---');
    const documentsResult = await documentTool.execute('list', { workflowId });
    console.log('✓ Documents listed:', {
      total: documentsResult.data.length,
      types: documentsResult.data.map(d => d.documentType)
    });

    // Test 13: Get Missing Documents
    console.log('\n--- Test 13: Get Missing Documents (Tool) ---');
    const missingResult = await documentTool.execute('get_missing', { workflowId });
    console.log('✓ Missing documents:', {
      missing: missingResult.data.missing,
      uploaded: missingResult.data.uploaded
    });

    // Test 14: Get AgentRun Stats
    console.log('\n--- Test 14: Get AgentRun Stats (Repository) ---');
    const stats = await agentRunRepository.getStats(workflowId);
    console.log('✓ AgentRun statistics:', stats);

    console.log('\n' + '='.repeat(60));
    console.log('ALL PERSISTENCE TESTS PASSED ✓');
    console.log('='.repeat(60));
    console.log('\nDatabase: SQLite (file:./dev.db)');
    console.log('Prisma Client: @prisma/client@5.22.0');
    console.log('\nData persisted successfully!');
    console.log('You can inspect the database using:');
    console.log('  npx prisma studio\n');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    throw error;
  } finally {
    await disconnectPrisma();
  }
}

// Run tests
testPersistenceLayer()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
