/**
 * messageRepository.js
 * 
 * Database operations for Message model.
 * No business logic - only data access.
 */

const { prisma } = require('../config/db');

/**
 * Create new message
 * 
 * @param {Object} data - Message data
 * @returns {Promise<Object>} Created message
 */
async function create(data) {
  return await prisma.message.create({
    data: {
      id: data.messageId || undefined,
      workflowId: data.workflowId,
      content: data.content,
      sender: data.sender || 'system',
      messageType: data.messageType || 'text',
      metadata: data.metadata ? JSON.stringify(data.metadata) : null
    }
  });
}

/**
 * Find message by ID
 * 
 * @param {string} id - Message ID
 * @returns {Promise<Object|null>} Message or null
 */
async function findById(id) {
  const message = await prisma.message.findUnique({
    where: { id }
  });

  if (message && message.metadata) {
    message.metadata = JSON.parse(message.metadata);
  }

  return message;
}

/**
 * List messages for workflow
 * 
 * @param {string} workflowId - Workflow ID
 * @param {Object} options - Query options
 * @returns {Promise<Array>} List of messages
 */
async function listByWorkflowId(workflowId, options = {}) {
  const { skip, take, orderBy } = options;
  
  const messages = await prisma.message.findMany({
    where: { workflowId },
    skip,
    take,
    orderBy: orderBy || { createdAt: 'asc' }
  });

  // Parse JSON metadata
  return messages.map(m => ({
    ...m,
    metadata: m.metadata ? JSON.parse(m.metadata) : null
  }));
}

/**
 * Get recent messages for workflow
 * 
 * @param {string} workflowId - Workflow ID
 * @param {number} limit - Number of messages
 * @returns {Promise<Array>} Recent messages
 */
async function getRecent(workflowId, limit = 10) {
  return await listByWorkflowId(workflowId, {
    take: limit,
    orderBy: { createdAt: 'desc' }
  });
}

/**
 * Delete message
 * 
 * @param {string} id - Message ID
 * @returns {Promise<Object>} Deleted message
 */
async function deleteById(id) {
  return await prisma.message.delete({
    where: { id }
  });
}

/**
 * Delete all messages for workflow
 * 
 * @param {string} workflowId - Workflow ID
 * @returns {Promise<Object>} Delete count
 */
async function deleteByWorkflowId(workflowId) {
  return await prisma.message.deleteMany({
    where: { workflowId }
  });
}

module.exports = {
  create,
  findById,
  listByWorkflowId,
  getRecent,
  deleteById,
  deleteByWorkflowId
};
