/**
 * workflowRepository.js
 * 
 * Database operations for Workflow model.
 * No business logic - only data access.
 */

const { prisma } = require('../config/db');

/**
 * Create new workflow
 * 
 * @param {Object} data - Workflow data
 * @returns {Promise<Object>} Created workflow
 */
async function create(data) {
  return await prisma.workflow.create({
    data: {
      id: data.workflowId || undefined,
      vendorId: data.vendorId || null,
      currentState: data.currentState,
      previousState: data.previousState || null,
      channel: data.channel || null,
      stateHistory: data.stateHistory ? JSON.stringify(data.stateHistory) : '[]',
      metadata: data.metadata ? JSON.stringify(data.metadata) : null
    }
  });
}

/**
 * Find workflow by ID
 * 
 * @param {string} id - Workflow ID
 * @returns {Promise<Object|null>} Workflow or null
 */
async function findById(id) {
  const workflow = await prisma.workflow.findUnique({
    where: { id },
    include: {
      vendor: true,
      messages: {
        orderBy: { createdAt: 'asc' },
        take: 50
      },
      documents: {
        orderBy: { uploadedAt: 'desc' }
      }
    }
  });

  // Parse JSON fields
  if (workflow) {
    workflow.stateHistory = JSON.parse(workflow.stateHistory || '[]');
    workflow.metadata = workflow.metadata ? JSON.parse(workflow.metadata) : null;
  }

  return workflow;
}

/**
 * Update workflow state
 * 
 * @param {string} id - Workflow ID
 * @param {Object} data - Update data
 * @returns {Promise<Object>} Updated workflow
 */
async function updateState(id, data) {
  const workflow = await findById(id);
  
  const stateHistory = workflow ? workflow.stateHistory : [];
  if (data.currentState && !stateHistory.includes(data.currentState)) {
    stateHistory.push(data.currentState);
  }

  return await prisma.workflow.update({
    where: { id },
    data: {
      currentState: data.currentState,
      previousState: data.previousState || workflow?.currentState,
      stateHistory: JSON.stringify(stateHistory),
      metadata: data.metadata ? JSON.stringify(data.metadata) : undefined
    }
  });
}

/**
 * Update workflow
 * 
 * @param {string} id - Workflow ID
 * @param {Object} data - Update data
 * @returns {Promise<Object>} Updated workflow
 */
async function update(id, data) {
  return await prisma.workflow.update({
    where: { id },
    data: {
      vendorId: data.vendorId,
      currentState: data.currentState,
      previousState: data.previousState,
      channel: data.channel,
      stateHistory: data.stateHistory ? JSON.stringify(data.stateHistory) : undefined,
      metadata: data.metadata ? JSON.stringify(data.metadata) : undefined
    }
  });
}

/**
 * List workflows
 * 
 * @param {Object} options - Query options
 * @returns {Promise<Array>} List of workflows
 */
async function list(options = {}) {
  const { skip, take, where, orderBy } = options;
  
  const workflows = await prisma.workflow.findMany({
    where,
    skip,
    take,
    orderBy: orderBy || { createdAt: 'desc' },
    include: {
      vendor: true
    }
  });

  // Parse JSON fields
  return workflows.map(w => ({
    ...w,
    stateHistory: JSON.parse(w.stateHistory || '[]'),
    metadata: w.metadata ? JSON.parse(w.metadata) : null
  }));
}

/**
 * Find workflow by vendor ID
 * 
 * @param {string} vendorId - Vendor ID
 * @returns {Promise<Object|null>} Workflow or null
 */
async function findByVendorId(vendorId) {
  const workflow = await prisma.workflow.findFirst({
    where: { vendorId },
    orderBy: { createdAt: 'desc' }
  });

  if (workflow) {
    workflow.stateHistory = JSON.parse(workflow.stateHistory || '[]');
    workflow.metadata = workflow.metadata ? JSON.parse(workflow.metadata) : null;
  }

  return workflow;
}

/**
 * Delete workflow
 * 
 * @param {string} id - Workflow ID
 * @returns {Promise<Object>} Deleted workflow
 */
async function deleteById(id) {
  return await prisma.workflow.delete({
    where: { id }
  });
}

module.exports = {
  create,
  findById,
  updateState,
  update,
  list,
  findByVendorId,
  deleteById
};
