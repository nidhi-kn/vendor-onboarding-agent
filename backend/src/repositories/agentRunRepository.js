/**
 * agentRunRepository.js
 * 
 * Database operations for AgentRun model.
 * Tracks every planner invocation for observability.
 * No business logic - only data access.
 */

const { prisma } = require('../config/db');

/**
 * Create new agent run
 * 
 * @param {Object} data - Agent run data
 * @returns {Promise<Object>} Created agent run
 */
async function create(data) {
  return await prisma.agentRun.create({
    data: {
      workflowId: data.workflowId,
      plannerInput: JSON.stringify(data.plannerInput),
      plannerOutput: data.plannerOutput ? JSON.stringify(data.plannerOutput) : null,
      reasoning: data.reasoning || null,
      decision: data.decision ? JSON.stringify(data.decision) : null,
      toolCallsCount: data.toolCallsCount || 0,
      status: data.status || 'pending',
      errorMessage: data.errorMessage || null,
      latencyMs: data.latencyMs || null,
      promptVersion: data.promptVersion || 'v1',
      modelName: data.modelName || 'llama-3.3-70b-versatile'
    }
  });
}

/**
 * Find agent run by ID
 * 
 * @param {string} id - Agent run ID
 * @returns {Promise<Object|null>} Agent run or null
 */
async function findById(id) {
  const run = await prisma.agentRun.findUnique({
    where: { id }
  });

  if (run) {
    run.plannerInput = JSON.parse(run.plannerInput);
    run.plannerOutput = run.plannerOutput ? JSON.parse(run.plannerOutput) : null;
    run.decision = run.decision ? JSON.parse(run.decision) : null;
  }

  return run;
}

/**
 * Update agent run with completion data
 * 
 * @param {string} id - Agent run ID
 * @param {Object} data - Update data
 * @returns {Promise<Object>} Updated agent run
 */
async function complete(id, data) {
  return await prisma.agentRun.update({
    where: { id },
    data: {
      plannerOutput: data.plannerOutput ? JSON.stringify(data.plannerOutput) : undefined,
      reasoning: data.reasoning,
      decision: data.decision ? JSON.stringify(data.decision) : undefined,
      toolCallsCount: data.toolCallsCount,
      status: data.status,
      errorMessage: data.errorMessage,
      latencyMs: data.latencyMs,
      completedAt: new Date()
    }
  });
}

/**
 * List agent runs for workflow
 * 
 * @param {string} workflowId - Workflow ID
 * @param {Object} options - Query options
 * @returns {Promise<Array>} List of agent runs
 */
async function listByWorkflowId(workflowId, options = {}) {
  const { skip, take, orderBy } = options;
  
  const runs = await prisma.agentRun.findMany({
    where: { workflowId },
    skip,
    take,
    orderBy: orderBy || { createdAt: 'desc' }
  });

  // Parse JSON fields
  return runs.map(r => ({
    ...r,
    plannerInput: JSON.parse(r.plannerInput),
    plannerOutput: r.plannerOutput ? JSON.parse(r.plannerOutput) : null,
    decision: r.decision ? JSON.parse(r.decision) : null
  }));
}

/**
 * Get agent run statistics
 * 
 * @param {string} workflowId - Workflow ID
 * @returns {Promise<Object>} Statistics
 */
async function getStats(workflowId) {
  const stats = await prisma.agentRun.aggregate({
    where: { workflowId },
    _count: true,
    _avg: {
      latencyMs: true
    },
    _max: {
      latencyMs: true
    },
    _min: {
      latencyMs: true
    }
  });

  const statusCounts = await prisma.agentRun.groupBy({
    by: ['status'],
    where: { workflowId },
    _count: true
  });

  return {
    totalRuns: stats._count,
    avgLatencyMs: stats._avg.latencyMs,
    maxLatencyMs: stats._max.latencyMs,
    minLatencyMs: stats._min.latencyMs,
    statusBreakdown: statusCounts.reduce((acc, item) => {
      acc[item.status] = item._count;
      return acc;
    }, {})
  };
}

/**
 * Delete agent run
 * 
 * @param {string} id - Agent run ID
 * @returns {Promise<Object>} Deleted agent run
 */
async function deleteById(id) {
  return await prisma.agentRun.delete({
    where: { id }
  });
}

module.exports = {
  create,
  findById,
  complete,
  listByWorkflowId,
  getStats,
  deleteById
};
