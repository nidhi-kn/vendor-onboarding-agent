/**
 * toolExecutor.js
 * 
 * Executes tasks from ExecutionPlan.
 * Uses ToolRegistry to find and invoke tools.
 * 
 * Responsibilities:
 * - Loop through execution tasks
 * - Find tool via registry
 * - Execute tool action
 * - Capture results and errors
 * - Continue unless fatal error
 */

const toolRegistry = require('../registry/toolRegistry');

class ToolExecutor {
  /**
   * Execute an execution plan
   * 
   * @param {Object} executionPlan - Plan from dispatcher
   * @returns {Promise<Object>} Execution result
   */
  async execute(executionPlan) {
    const executionId = this.generateExecutionId();
    const startTime = Date.now();

    this.log('info', 'ExecutionStarted', {
      executionId,
      tasksCount: executionPlan.executionTasks.length
    });

    const results = [];
    const errors = [];
    let fatalError = false;

    // Execute tasks in order
    for (const task of executionPlan.executionTasks) {
      if (fatalError) {
        this.log('warn', 'Skipping task due to fatal error', {
          taskId: task.taskId
        });
        continue;
      }

      try {
        this.log('info', 'ToolStarted', {
          executionId,
          taskId: task.taskId,
          tool: task.tool,
          action: task.action,
          priority: task.priority
        });

        const result = await this.executeTask(task);

        this.log('info', 'ToolCompleted', {
          executionId,
          taskId: task.taskId,
          tool: task.tool,
          action: task.action,
          success: result.success
        });

        results.push({
          taskId: task.taskId,
          tool: task.tool,
          action: task.action,
          success: result.success,
          result: result.data || result,
          executedAt: new Date()
        });

      } catch (error) {
        this.log('error', 'ToolFailed', {
          executionId,
          taskId: task.taskId,
          tool: task.tool,
          action: task.action,
          error: error.message
        });

        const errorRecord = {
          taskId: task.taskId,
          tool: task.tool,
          action: task.action,
          error: error.message,
          fatal: this.isFatal(task, error),
          occurredAt: new Date()
        };

        errors.push(errorRecord);

        if (errorRecord.fatal) {
          fatalError = true;
        }
      }
    }

    const duration = Date.now() - startTime;

    const executionResult = {
      success: errors.length === 0 || !fatalError,
      executionId,
      results,
      errors,
      executionTime: duration,
      completedAt: new Date()
    };

    this.log('info', 'ExecutionCompleted', {
      executionId,
      duration,
      successCount: results.filter(r => r.success).length,
      errorCount: errors.length,
      totalTasks: executionPlan.executionTasks.length
    });

    return executionResult;
  }

  /**
   * Execute single task
   * @private
   */
  async executeTask(task) {
    const { tool, action, args } = task;

    // Get tool from registry
    if (!toolRegistry.has(tool)) {
      throw new Error(`Tool not registered: ${tool}`);
    }

    const toolInstance = toolRegistry.get(tool);

    // Execute tool action
    const result = await toolInstance.execute(action, args);

    return result;
  }

  /**
   * Determine if error is fatal
   * @private
   */
  isFatal(task, error) {
    // High priority tasks are fatal if they fail
    if (task.priority === 'high') {
      return true;
    }

    // Workflow state updates are fatal
    if (task.tool === 'workflow' && task.action === 'update_state') {
      return true;
    }

    // Tool not found is fatal
    if (error.message.includes('not registered')) {
      return true;
    }

    // Default: non-fatal
    return false;
  }

  /**
   * Generate unique execution ID
   * @private
   */
  generateExecutionId() {
    return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Logger
   * @private
   */
  log(level, message, metadata = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      service: 'ToolExecutor',
      message,
      ...metadata
    };

    const logMethod = level === 'error' ? console.error : console.log;
    logMethod(JSON.stringify(logEntry));
  }
}

// Export singleton
module.exports = new ToolExecutor();
