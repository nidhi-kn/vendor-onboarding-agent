/**
 * loggerTool.js
 * 
 * Logs workflow events and maintains timeline.
 * Uses Prisma for persistent audit logging.
 */

const auditLogRepository = require('../repositories/auditLogRepository');

class LoggerTool {
  constructor() {
    // No in-memory storage - using database via repository
  }

  /**
   * Execute logger action
   * 
   * @param {string} action - Action to execute
   * @param {Object} args - Action arguments
   * @returns {Promise<Object>} Action result
   */
  async execute(action, args) {
    switch (action) {
      case 'log_event':
        return await this.log(args);
      
      case 'get_timeline':
        return await this.timeline(args);
      
      default:
        throw new Error(`Unknown logger action: ${action}`);
    }
  }

  /**
   * Log event
   */
  async log(args) {
    const { workflowId, event, description, metadata } = args;

    if (!workflowId || !event) {
      throw new Error('workflowId and event are required');
    }

    const logEntry = await auditLogRepository.create({
      workflowId,
      actor: 'agent',
      action: event,
      description: description || '',
      metadata: metadata || {}
    });

    // Also log to console
    console.log(JSON.stringify({
      timestamp: logEntry.timestamp.toISOString(),
      level: 'info',
      service: 'LoggerTool',
      workflowId,
      event,
      description
    }));

    return {
      success: true,
      data: logEntry
    };
  }

  /**
   * Get timeline for workflow
   */
  async timeline(args) {
    const { workflowId, limit } = args;

    if (!workflowId) {
      throw new Error('workflowId is required');
    }

    const events = await auditLogRepository.listByWorkflowId(workflowId, {
      take: limit || undefined
    });

    return {
      success: true,
      data: events
    };
  }
}

// Export singleton
module.exports = new LoggerTool();
