/**
 * conversationTool.js
 * 
 * Manages conversation/message operations.
 * Uses Prisma for persistent storage.
 */

const messageRepository = require('../repositories/messageRepository');

class ConversationTool {
  constructor() {
    // No in-memory storage - using database via repository
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

    const messageRecord = await messageRepository.create({
      workflowId,
      content: message,
      sender: sender || 'system',
      messageType: messageType || 'text'
    });

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

    const messages = await messageRepository.listByWorkflowId(workflowId, {
      take: limit || undefined
    });

    return {
      success: true,
      data: messages
    };
  }
}

// Export singleton
module.exports = new ConversationTool();
