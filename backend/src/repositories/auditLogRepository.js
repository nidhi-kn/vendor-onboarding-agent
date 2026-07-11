/**
 * auditLogRepository.js
 * 
 * Database operations for AuditLog model.
 * Tracks all workflow transitions and important actions.
 * No business logic - only data access.
 */

const { prisma } = require('../config/db');

/**
 * Create new audit log entry
 * 
 * @param {Object} data - Audit log data
 * @returns {Promise<Object>} Created audit log
 */
async function create(data) {
  return await prisma.auditLog.create({
    data: {
      workflowId: data.workflowId,
      actor: data.actor || 'system',
      action: data.action,
      fromState: data.fromState || null,
      toState: data.toState || null,
      description: data.description || null,
      metadata: data.metadata ? JSON.stringify(data.metadata) : null
    }
  });
}

/**
 * Find audit log by ID
 * 
 * @param {string} id - Audit log ID
 * @returns {Promise<Object|null>} Audit log or null
 */
async function findById(id) {
  const log = await prisma.auditLog.findUnique({
    where: { id }
  });

  if (log && log.metadata) {
    log.metadata = JSON.parse(log.metadata);
  }

  return log;
}

/**
 * List audit logs for workflow
 * 
 * @param {string} workflowId - Workflow ID
 * @param {Object} options - Query options
 * @returns {Promise<Array>} List of audit logs
 */
async function listByWorkflowId(workflowId, options = {}) {
  const { skip, take, orderBy, where } = options;
  
  const logs = await prisma.auditLog.findMany({
    where: {
      workflowId,
      ...where
    },
    skip,
    take,
    orderBy: orderBy || { timestamp: 'asc' }
  });

  // Parse JSON metadata
  return logs.map(l => ({
    ...l,
    metadata: l.metadata ? JSON.parse(l.metadata) : null
  }));
}

/**
 * List audit logs by action type
 * 
 * @param {string} action - Action type
 * @param {Object} options - Query options
 * @returns {Promise<Array>} List of audit logs
 */
async function listByAction(action, options = {}) {
  const { skip, take, orderBy } = options;
  
  const logs = await prisma.auditLog.findMany({
    where: { action },
    skip,
    take,
    orderBy: orderBy || { timestamp: 'desc' },
    include: {
      workflow: {
        include: {
          vendor: true
        }
      }
    }
  });

  // Parse JSON metadata
  return logs.map(l => ({
    ...l,
    metadata: l.metadata ? JSON.parse(l.metadata) : null
  }));
}

/**
 * Get audit trail for workflow (full history)
 * 
 * @param {string} workflowId - Workflow ID
 * @returns {Promise<Array>} Complete audit trail
 */
async function getAuditTrail(workflowId) {
  return await listByWorkflowId(workflowId, {
    orderBy: { timestamp: 'asc' }
  });
}

/**
 * Delete audit log
 * 
 * @param {string} id - Audit log ID
 * @returns {Promise<Object>} Deleted audit log
 */
async function deleteById(id) {
  return await prisma.auditLog.delete({
    where: { id }
  });
}

/**
 * Delete all audit logs for workflow
 * 
 * @param {string} workflowId - Workflow ID
 * @returns {Promise<Object>} Delete count
 */
async function deleteByWorkflowId(workflowId) {
  return await prisma.auditLog.deleteMany({
    where: { workflowId }
  });
}

module.exports = {
  create,
  findById,
  listByWorkflowId,
  listByAction,
  getAuditTrail,
  deleteById,
  deleteByWorkflowId
};
