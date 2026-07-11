/**
 * workflowContextBuilder.js
 * 
 * Builds normalized PlannerRequest from workflow event.
 * Prepares all context required by the Planner.
 * 
 * Uses real repositories to read from database.
 */

const { WORKFLOW_STATES, MESSAGE_TYPES } = require('../agent/constants');
const workflowRepository = require('../repositories/workflowRepository');
const vendorRepository = require('../repositories/vendorRepository');
const messageRepository = require('../repositories/messageRepository');
const documentRepository = require('../repositories/documentRepository');

class WorkflowContextBuilder {
  /**
   * Load vendor information
   * 
   * @param {string} vendorId - Vendor identifier
   * @returns {Promise<Object>} Vendor context
   */
  async loadVendor(vendorId) {
    // If no vendorId, return empty vendor shape
    if (!vendorId) {
      return {
        vendorId: null,
        companyName: null,
        contactPerson: null,
        email: null,
        phone: null,
        gstNumber: null,
        panNumber: null,
        bankAccountNumber: null,
        ifscCode: null,
        metadata: {}
      };
    }

    // Load from repository
    const vendor = await vendorRepository.findById(vendorId);
    
    if (!vendor) {
      // Return empty shape if not found
      return {
        vendorId: vendorId,
        companyName: null,
        contactPerson: null,
        email: null,
        phone: null,
        gstNumber: null,
        panNumber: null,
        bankAccountNumber: null,
        ifscCode: null,
        metadata: {}
      };
    }

    // Map repository fields to expected shape
    return {
      vendorId: vendor.id,
      companyName: vendor.companyName,
      contactPerson: vendor.contactPerson,
      email: vendor.email,
      phone: vendor.phone,
      gstNumber: vendor.gstNumber,
      panNumber: vendor.panNumber,
      bankAccountNumber: vendor.bankAccount ? vendor.bankAccount.accountNumber : null,
      ifscCode: vendor.bankAccount ? vendor.bankAccount.ifscCode : null,
      metadata: vendor.metadata || {}
    };
  }

  /**
   * Load workflow state
   * 
   * @param {string} workflowId - Workflow identifier
   * @returns {Promise<Object>} Workflow context
   */
  async loadWorkflow(workflowId) {
    // Try to find existing workflow
    let workflow = await workflowRepository.findById(workflowId);
    
    if (!workflow) {
      // Create workflow if it doesn't exist (first message for this workflow)
      workflow = await workflowRepository.create({
        workflowId: workflowId,
        currentState: WORKFLOW_STATES.START,
        previousState: null,
        stateHistory: [WORKFLOW_STATES.START],
        metadata: {}
      });
    }

    // Return expected shape
    return {
      workflowId: workflow.id,
      currentState: workflow.currentState,
      previousState: workflow.previousState,
      stateHistory: workflow.stateHistory, // Already parsed by repository
      createdAt: workflow.createdAt,
      updatedAt: workflow.updatedAt,
      metadata: workflow.metadata || {},
      assignedTo: workflow.assignedTo || null,
      vendorId: workflow.vendorId
    };
  }

  /**
   * Load conversation history
   * 
   * @param {string} workflowId - Workflow identifier
   * @param {number} limit - Maximum messages to load
   * @returns {Promise<Array>} Conversation messages
   */
  async loadConversation(workflowId, limit = 10) {
    const messages = await messageRepository.getRecent(workflowId, limit);
    
    // Map to planner-expected format (reverse to chronological order)
    return messages.reverse().map(msg => ({
      messageType: msg.messageType || MESSAGE_TYPES.TEXT,
      content: msg.content || '',
      sender: msg.sender || 'unknown',
      timestamp: msg.createdAt,
      metadata: msg.metadata || {}
    }));
  }

  /**
   * Load uploaded documents
   * 
   * @param {string} workflowId - Workflow identifier
   * @returns {Promise<Array>} Documents
   */
  async loadDocuments(workflowId) {
    const documents = await documentRepository.listByWorkflowId(workflowId);
    
    // Map to planner-expected format
    return documents.map(doc => ({
      documentType: doc.documentType,
      fileName: doc.fileName,
      fileUrl: doc.fileUrl,
      status: doc.status || 'pending',
      uploadedAt: doc.uploadedAt || doc.createdAt,
      verifiedAt: doc.verifiedAt,
      metadata: doc.metadata || {}
    }));
  }

  /**
   * Build complete PlannerRequest from workflow event
   * 
   * @param {Object} workflowEvent - Incoming workflow event
   * @param {string} workflowEvent.workflowId - Workflow ID
   * @param {Object} workflowEvent.incomingMessage - Message that triggered event
   * @returns {Promise<Object>} Complete PlannerRequest
   */
  async buildPlannerInput(workflowEvent) {
    const { workflowId, incomingMessage } = workflowEvent;

    // Load workflow first (fixes the sequencing bug and creates workflow if needed)
    const workflowContext = await this.loadWorkflow(workflowId);

    // Load vendor, conversation, and documents in parallel
    const [vendorContext, conversationHistory, documents] = await Promise.all([
      this.loadVendor(workflowContext.vendorId),
      this.loadConversation(workflowId),
      this.loadDocuments(workflowId)
    ]);

    // Normalize incoming message
    const normalizedMessage = this.normalizeMessage(incomingMessage);

    // Build complete planner input
    const plannerRequest = {
      vendorContext,
      workflowContext,
      documents,
      conversationHistory,
      incomingMessage: normalizedMessage
    };

    return plannerRequest;
  }

  /**
   * Normalize incoming message to standard format
   * @private
   */
  normalizeMessage(message) {
    return {
      messageType: message.messageType || MESSAGE_TYPES.TEXT,
      content: message.content || '',
      senderId: message.senderId || message.from || 'unknown',
      senderName: message.senderName || message.sender || 'Unknown',
      timestamp: message.timestamp || new Date(),
      documentUrl: message.documentUrl || message.fileUrl || null,
      documentType: message.documentType || null
    };
  }
}

// Export singleton
module.exports = new WorkflowContextBuilder();