/**
 * approvalRepository.js
 * 
 * Database operations for Approval model.
 * No business logic - only data access.
 */

const { prisma } = require('../config/db');

/**
 * Create new approval
 * 
 * @param {Object} data - Approval data
 * @returns {Promise<Object>} Created approval
 */
async function create(data) {
  return await prisma.approval.create({
    data: {
      id: data.approvalId || undefined,
      workflowId: data.workflowId,
      vendorId: data.vendorId || null,
      status: data.status || 'pending',
      requestedBy: data.requestedBy || null,
      metadata: data.metadata ? JSON.stringify(data.metadata) : null
    }
  });
}

/**
 * Find approval by ID
 * 
 * @param {string} id - Approval ID
 * @returns {Promise<Object|null>} Approval or null
 */
async function findById(id) {
  const approval = await prisma.approval.findUnique({
    where: { id }
  });

  if (approval && approval.metadata) {
    approval.metadata = JSON.parse(approval.metadata);
  }

  return approval;
}

/**
 * Find approval by workflow ID
 * 
 * @param {string} workflowId - Workflow ID
 * @returns {Promise<Object|null>} Approval or null
 */
async function findByWorkflowId(workflowId) {
  const approval = await prisma.approval.findFirst({
    where: { workflowId },
    orderBy: { requestedAt: 'desc' }
  });

  if (approval && approval.metadata) {
    approval.metadata = JSON.parse(approval.metadata);
  }

  return approval;
}

/**
 * Update approval
 * 
 * @param {string} id - Approval ID
 * @param {Object} data - Update data
 * @returns {Promise<Object>} Updated approval
 */
async function update(id, data) {
  return await prisma.approval.update({
    where: { id },
    data: {
      status: data.status,
      approvedBy: data.approvedBy,
      rejectedBy: data.rejectedBy,
      reason: data.reason,
      approvedAt: data.approvedAt,
      rejectedAt: data.rejectedAt,
      metadata: data.metadata ? JSON.stringify(data.metadata) : undefined
    }
  });
}

/**
 * List approvals
 * 
 * @param {Object} options - Query options
 * @returns {Promise<Array>} List of approvals
 */
async function list(options = {}) {
  const { skip, take, where, orderBy } = options;
  
  const approvals = await prisma.approval.findMany({
    where,
    skip,
    take,
    orderBy: orderBy || { requestedAt: 'desc' },
    include: {
      workflow: {
        include: {
          vendor: true
        }
      }
    }
  });

  // Parse JSON metadata
  return approvals.map(a => ({
    ...a,
    metadata: a.metadata ? JSON.parse(a.metadata) : null
  }));
}

/**
 * List pending approvals
 * 
 * @returns {Promise<Array>} Pending approvals
 */
async function listPending() {
  return await list({
    where: { status: 'pending' }
  });
}

/**
 * Delete approval
 * 
 * @param {string} id - Approval ID
 * @returns {Promise<Object>} Deleted approval
 */
async function deleteById(id) {
  return await prisma.approval.delete({
    where: { id }
  });
}

module.exports = {
  create,
  findById,
  findByWorkflowId,
  update,
  list,
  listPending,
  deleteById
};
