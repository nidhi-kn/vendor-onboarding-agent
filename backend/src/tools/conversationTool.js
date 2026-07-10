/**
 * conversationTool.js
 * 
 * Manages conversation/message operations.
 * Currently uses in-memory storage (mocked).
 * Phase 4 will replace with repository + database.
 */

class ConversationTool {
  constructor() {
    // In-memory storage (mock)
    this.conversations = new Map();
  }

  /**
   * Execute conversation action
   * 
   * @param {string} action - Action to execute
   * @param {Object} args - Action arguments
   * @returns {Promise<Object>} Action result
   */
  async execute(action, args) {
    switch (action) {
      case 'save_message':
        return await this.saveMessage(args);
      
      case 'get_history':
        return await this.history(args);
      
      default:
        throw new Error(`Unknown conversation action: ${action}`);
    }
  }

  /**
   * Save message to conversation
   */
  async saveMessage(args) {
    const { workflowId, message, sender, messageType } = args;

    if (!workflowId || !message) {
      throw new Error('workflowId and message are required');
    }

    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const messageRecord = {
      messageId,
      workflowId,
      content: message,
      sender: sender || 'system',
      messageType: messageType || 'text',
      timestamp: new Date()
    };

    // Store by workflow
    if (!this.conversations.has(workflowId)) {
      this.conversations.set(workflowId, []);
    }

    this.conversations.get(workflowId).push(messageRecord);

    return {
      success: true,
      data: messageRecord
    };
  }

  /**
   * Get conversation history
   */
  async history(args) {
    const { workflowId, limit } = args;

    if (!workflowId) {
      throw new Error('workflowId is required');
    }

    let messages = this.conversations.get(workflowId) || [];

    // Apply limit if specified
    if (limit && limit > 0) {
      messages = messages.slice(-limit);
    }

    return {
      success: true,
      data: messages
    };
  }
}

// Export singleton
module.exports = new ConversationTool();
