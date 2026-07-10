/**
 * workflowTool.js
 * 
 * Manages workflow state operations.
 * Currently uses in-memory storage (mocked).
 * Phase 4 will replace with repository + database.
 */

const { WORKFLOW_STATES } = require('../agent/constants');

class WorkflowTool {
  constructor() {
    // In-memory storage (mock)
    this.workflows = new Map();
  }

  /**
   * Execute workflow action
   * 
   * @param {string} action - Action to execute
   * @param {Object} args - Action arguments
   * @returns {Promise<Object>} Action result
   */
  async execute(action, args) {
    switch (action) {
      case 'get_state':
        return await this.getState(args);
      
      case 'update_state':
        return await this.updateState(args);
      
      case 'validate_state':
        return await this.validateState(args);
      
      default:
        throw new Error(`Unknown workflow action: ${action}`);
    }
  }

  /**
   * Get current workflow state
   */
  async getState(args) {
    const { workflowId } = args;

    if (!workflowId) {
      throw new Error('workflowId is required');
    }

    const workflow = this.workflows.get(workflowId) || {
      workflowId,
      currentState: WORKFLOW_STATES.START,
      previousState: null,
      stateHistory: [WORKFLOW_STATES.START],
      updatedAt: new Date()
    };

    return {
      success: true,
      data: workflow
    };
  }

  /**
   * Update workflow state
   */
  async updateState(args) {
    const { workflowId, fromState, toState } = args;

    if (!workflowId || !toState) {
      throw new Error('workflowId and toState are required');
    }

    const workflow = this.workflows.get(workflowId) || {
      workflowId,
      currentState: WORKFLOW_STATES.START,
      stateHistory: [WORKFLOW_STATES.START]
    };

    // Update state
    workflow.previousState = workflow.currentState;
    workflow.currentState = toState;
    workflow.stateHistory.push(toState);
    workflow.updatedAt = new Date();

    this.workflows.set(workflowId, workflow);

    return {
      success: true,
      data: {
        workflowId,
        fromState: workflow.previousState,
        toState: workflow.currentState,
        transitionedAt: workflow.updatedAt
      }
    };
  }

  /**
   * Validate workflow state
   */
  async validateState(args) {
    const { workflowId, expectedState } = args;

    const workflow = this.workflows.get(workflowId);

    if (!workflow) {
      return {
        success: false,
        valid: false,
        message: 'Workflow not found'
      };
    }

    const isValid = workflow.currentState === expectedState;

    return {
      success: true,
      valid: isValid,
      currentState: workflow.currentState,
      expectedState
    };
  }
}

// Export singleton
module.exports = new WorkflowTool();
