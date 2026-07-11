/**
 * workflowTool.js
 * 
 * Manages workflow state operations.
 * Uses Prisma for persistent storage.
 */

const { WORKFLOW_STATES } = require('../agent/constants');
const workflowRepository = require('../repositories/workflowRepository');
const auditLogRepository = require('../repositories/auditLogRepository');

class WorkflowTool {
  constructor() {
    // No in-memory storage - using database via repository
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

    let workflow = await workflowRepository.findById(workflowId);

    if (!workflow) {
      // Create workflow if doesn't exist
      workflow = await workflowRepository.create({
        workflowId,
        currentState: WORKFLOW_STATES.START,
        previousState: null,
        stateHistory: [WORKFLOW_STATES.START]
      });
    }

    return {
      success: true,
      data: {
        workflowId: workflow.id,
        currentState: workflow.currentState,
        previousState: workflow.previousState,
        stateHistory: workflow.stateHistory,
        updatedAt: workflow.updatedAt
      }
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

    let workflow = await workflowRepository.findById(workflowId);

    if (!workflow) {
      // Create if doesn't exist
      workflow = await workflowRepository.create({
        workflowId,
        currentState: WORKFLOW_STATES.START,
        stateHistory: [WORKFLOW_STATES.START]
      });
    }

    const previousState = workflow.currentState;

    // Update workflow state
    const updatedWorkflow = await workflowRepository.updateState(workflowId, {
      currentState: toState,
      previousState: previousState
    });

    // Create audit log for state transition
    await auditLogRepository.create({
      workflowId,
      actor: 'agent',
      action: 'state_transition',
      fromState: previousState,
      toState: toState,
      description: `Workflow transitioned from ${previousState} to ${toState}`
    });

    return {
      success: true,
      data: {
        workflowId,
        fromState: previousState,
        toState: toState,
        transitionedAt: updatedWorkflow.updatedAt
      }
    };
  }

  /**
   * Validate workflow state
   */
  async validateState(args) {
    const { workflowId, expectedState } = args;

    const workflow = await workflowRepository.findById(workflowId);

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
