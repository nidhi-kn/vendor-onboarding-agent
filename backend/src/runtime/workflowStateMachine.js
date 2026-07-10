/**
 * workflowStateMachine.js
 * 
 * Configuration-driven state machine for workflow transitions.
 * Uses existing VALID_TRANSITIONS from constants.js
 * 
 * Responsibilities:
 * - Validate state transitions
 * - Get allowed next states
 * - Check transition validity
 */

const { WORKFLOW_STATES, VALID_TRANSITIONS } = require('../agent/constants');

class WorkflowStateMachine {
  constructor() {
    this.states = WORKFLOW_STATES;
    this.transitions = VALID_TRANSITIONS;
  }

  /**
   * Check if transition from current to next state is valid
   * 
   * @param {string} currentState - Current workflow state
   * @param {string} nextState - Proposed next state
   * @returns {boolean} True if transition is valid
   */
  isValidTransition(currentState, nextState) {
    if (!currentState || !nextState) {
      return false;
    }

    if (!this.transitions[currentState]) {
      return false;
    }

    return this.transitions[currentState].includes(nextState);
  }

  /**
   * Get all allowed next states from current state
   * 
   * @param {string} currentState - Current workflow state
   * @returns {string[]} Array of allowed next states
   */
  getNextAllowedStates(currentState) {
    if (!currentState || !this.transitions[currentState]) {
      return [];
    }

    return this.transitions[currentState];
  }

  /**
   * Validate transition and return result with details
   * 
   * @param {string} currentState - Current workflow state
   * @param {string} nextState - Proposed next state
   * @returns {Object} Validation result
   */
  validateTransition(currentState, nextState) {
    if (!currentState) {
      return {
        valid: false,
        error: 'Current state is required',
        allowedStates: []
      };
    }

    if (!Object.values(this.states).includes(currentState)) {
      return {
        valid: false,
        error: `Invalid current state: ${currentState}`,
        allowedStates: []
      };
    }

    const allowedStates = this.getNextAllowedStates(currentState);

    if (!nextState) {
      return {
        valid: true,
        error: null,
        allowedStates,
        message: 'No state transition requested'
      };
    }

    if (!Object.values(this.states).includes(nextState)) {
      return {
        valid: false,
        error: `Invalid next state: ${nextState}`,
        allowedStates
      };
    }

    const isValid = this.isValidTransition(currentState, nextState);

    if (isValid) {
      return {
        valid: true,
        error: null,
        allowedStates,
        message: `Valid transition: ${currentState} -> ${nextState}`
      };
    }

    return {
      valid: false,
      error: `Invalid transition: ${currentState} -> ${nextState}`,
      allowedStates,
      message: `Allowed transitions from ${currentState}: ${allowedStates.join(', ')}`
    };
  }

  /**
   * Check if state is terminal (no further transitions)
   * 
   * @param {string} state - State to check
   * @returns {boolean} True if terminal state
   */
  isTerminalState(state) {
    const allowedStates = this.getNextAllowedStates(state);
    return allowedStates.length === 0;
  }
}

// Export singleton
module.exports = new WorkflowStateMachine();
