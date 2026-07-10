/**
 * workflowDispatcher.js
 * 
 * Converts PlannerResponse into ExecutionPlan.
 * Prepares tool executions for Phase 3 (Tool Executor).
 * 
 * Does NOT execute tools - only prepares them.
 */

class WorkflowDispatcher {
  /**
   * Convert planner response to execution plan
   * 
   * @param {Object} plannerResponse - Response from planner
   * @param {Object} workflowContext - Current workflow context
   * @returns {Object} Execution plan
   */
  dispatch(plannerResponse, workflowContext) {
    const executionPlan = {
      currentState: workflowContext.currentState,
      nextState: plannerResponse.nextState || workflowContext.currentState,
      confidence: this.calculateConfidence(plannerResponse),
      responseMessage: plannerResponse.responseMessage,
      executionTasks: []
    };

    // Convert tool calls to execution tasks
    if (Array.isArray(plannerResponse.toolCalls)) {
      executionPlan.executionTasks = plannerResponse.toolCalls.map((toolCall, index) => 
        this.createExecutionTask(toolCall, index)
      );
    }

    // Add state transition task if needed
    if (plannerResponse.nextState && 
        plannerResponse.nextState !== workflowContext.currentState) {
      executionPlan.executionTasks.push({
        tool: 'workflow',
        action: 'update_state',
        args: {
          workflowId: workflowContext.workflowId,
          fromState: workflowContext.currentState,
          toState: plannerResponse.nextState
        },
        priority: 'high',
        taskId: `state_transition_${Date.now()}`
      });
    }

    return executionPlan;
  }

  /**
   * Create execution task from tool call
   * @private
   */
  createExecutionTask(toolCall, index) {
    return {
      tool: toolCall.tool,
      action: toolCall.action,
      args: toolCall.parameters || {},
      priority: this.determinePriority(toolCall),
      taskId: `task_${Date.now()}_${index}`
    };
  }

  /**
   * Determine task priority based on tool and action
   * @private
   */
  determinePriority(toolCall) {
    // High priority for critical operations
    const highPriorityTools = ['workflow', 'approval'];
    if (highPriorityTools.includes(toolCall.tool)) {
      return 'high';
    }

    // Low priority for logging
    if (toolCall.tool === 'logger') {
      return 'low';
    }

    // Default to normal
    return 'normal';
  }

  /**
   * Calculate execution confidence
   * @private
   */
  calculateConfidence(plannerResponse) {
    let confidence = 'high';

    // Lower confidence if no reasoning
    if (!plannerResponse.reasoning || plannerResponse.reasoning.length < 50) {
      confidence = 'medium';
    }

    // Lower confidence if too many tool calls (might be confused)
    if (plannerResponse.toolCalls && plannerResponse.toolCalls.length > 5) {
      confidence = 'medium';
    }

    // Very low confidence if critical fields missing
    if (!plannerResponse.decision || !plannerResponse.responseMessage) {
      confidence = 'low';
    }

    return confidence;
  }
}

// Export singleton
module.exports = new WorkflowDispatcher();
