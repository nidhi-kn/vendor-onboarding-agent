/**
 * workflowContextBuilder.js
 * 
 * Builds normalized PlannerRequest from workflow event.
 * Prepares all context required by the Planner.
 * 
 * Currently returns mocked data.
 * Designed with interfaces that repositories can replace later.
 */

const { WORKFLOW_STATES, MESSAGE_TYPES } = require('../agent/constants');

class WorkflowContextBuilder {
  /**
   * Load vendor information
   * 
   * @param {string} vendorId - Vendor identifier
   * @returns {Promise<Object>} Vendor context
   */
  async loadVendor(vendorId) {
    // TODO: Replace with repository call in Phase 4
    // return await vendorRepository.findById(vendorId);
    
    return {
      vendorId: vendorId || null,
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

  /**
   * Load workflow state
   * 
   * @param {string} workflowId - Workflow identifier
   * @returns {Promise<Object>} Workflow context
   */
  async loadWorkflow(workflowId) {
    // TODO: Replace with repository call in Phase 4
    // return await workflowRepository.findById(workflowId);
    
    return {
      workflowId: workflowId,
      currentState: WORKFLOW_STATES.START,
      previousState: null,
      stateHistory: [WORKFLOW_STATES.START],
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: {},
      assignedTo: null
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
    // TODO: Replace with repository call in Phase 4
    // return await conversationRepository.findByWorkflowId(workflowId, limit);
    
    return [];
  }

  /**
   * Load uploaded documents
   * 
   * @param {string} workflowId - Workflow identifier
   * @returns {Promise<Array>} Documents
   */
  async loadDocuments(workflowId) {
    // TODO: Replace with repository call in Phase 4
    // return await documentRepository.findByWorkflowId(workflowId);
    
    return [];
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

    // Load all context in parallel
    const [vendorContext, workflowContext, conversationHistory, documents] = 
      await Promise.all([
        this.loadVendor(workflowContext?.vendorId || workflowId),
        this.loadWorkflow(workflowId),
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
