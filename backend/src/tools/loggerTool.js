/**
 * loggerTool.js
 * 
 * Logs workflow events and maintains timeline.
 * Currently uses console logging (mocked).
 * Phase 4 can replace with database-backed logging.
 */

class LoggerTool {
  constructor() {
    // In-memory timeline storage (mock)
    this.timelines = new Map();
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

    const eventId = `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const logEntry = {
      eventId,
      workflowId,
      event,
      description: description || '',
      metadata: metadata || {},
      timestamp: new Date()
    };

    // Store in timeline
    if (!this.timelines.has(workflowId)) {
      this.timelines.set(workflowId, []);
    }

    this.timelines.get(workflowId).push(logEntry);

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

    let events = this.timelines.get(workflowId) || [];

    // Apply limit if specified
    if (limit && limit > 0) {
      events = events.slice(-limit);
    }

    return {
      success: true,
      data: events
    };
  }
}

// Export singleton
module.exports = new LoggerTool();
