/**
 * connector.service.js
 * 
 * Service layer for connector operations.
 * Receives normalized messages from external connectors.
 * Delegates to WorkflowService.
 */

const workflowService = require('./workflow.service');

class ConnectorService {
  /**
   * Process incoming message from any connector
   * 
   * @param {Object} message - Normalized connector message
   * @returns {Promise<Object>} Processing result
   */
  async processMessage(message) {
    const {
      connectorId,
      workflowId,
      channelId,
      senderId,
      senderName,
      text,
      attachments
    } = message;

    // Validate required fields
    if (!workflowId) {
      throw new Error('workflowId is required');
    }

    if (!senderId) {
      throw new Error('senderId is required');
    }

    // Log connector message
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'info',
      service: 'ConnectorService',
      connectorId,
      workflowId,
      channelId,
      senderId
    }));

    // Normalize message structure
    const normalizedMessage = {
      workflowId,
      text: text || '',
      senderId,
      senderName: senderName || senderId,
      attachments: attachments || []
    };

    // Delegate to workflow service
    const result = await workflowService.processIncomingMessage(normalizedMessage);

    return {
      connectorId,
      workflowId,
      processed: true,
      result
    };
  }
}

// Export singleton
module.exports = new ConnectorService();
