/**
 * constants.js
 * 
 * Central location for all Planner Agent constants.
 * This file defines all workflow states, tool types, and decision types.
 * 
 * DO NOT modify these values without updating the state machine logic.
 */

/**
 * Workflow States
 * 
 * Represents all possible states in the vendor onboarding workflow.
 * The Planner Agent uses these states to understand current context
 * and decide on next actions.
 */
const WORKFLOW_STATES = {
  // Initial state
  START: 'START',
  
  // Information gathering states
  WAITING_VENDOR_DETAILS: 'WAITING_VENDOR_DETAILS',
  WAITING_GST: 'WAITING_GST',
  WAITING_PAN: 'WAITING_PAN',
  WAITING_BANK_PROOF: 'WAITING_BANK_PROOF',
  
  // Processing states
  DOCUMENT_VERIFICATION: 'DOCUMENT_VERIFICATION',
  WAITING_FINANCE_APPROVAL: 'WAITING_FINANCE_APPROVAL',
  
  // Success states
  APPROVED: 'APPROVED',
  ERP_SYNC: 'ERP_SYNC',
  COMPLETED: 'COMPLETED',
  
  // Error/retry states
  REUPLOAD_REQUIRED: 'REUPLOAD_REQUIRED',
  REJECTED: 'REJECTED'
};

/**
 * Valid state transitions
 * 
 * Defines which state transitions are allowed.
 * Used to validate that the Planner doesn't request invalid transitions.
 */
const VALID_TRANSITIONS = {
  [WORKFLOW_STATES.START]: [WORKFLOW_STATES.WAITING_VENDOR_DETAILS],
  
  [WORKFLOW_STATES.WAITING_VENDOR_DETAILS]: [
    WORKFLOW_STATES.WAITING_GST,
    WORKFLOW_STATES.REUPLOAD_REQUIRED
  ],
  
  [WORKFLOW_STATES.WAITING_GST]: [
    WORKFLOW_STATES.WAITING_PAN,
    WORKFLOW_STATES.REUPLOAD_REQUIRED
  ],
  
  [WORKFLOW_STATES.WAITING_PAN]: [
    WORKFLOW_STATES.WAITING_BANK_PROOF,
    WORKFLOW_STATES.REUPLOAD_REQUIRED
  ],
  
  [WORKFLOW_STATES.WAITING_BANK_PROOF]: [
    WORKFLOW_STATES.DOCUMENT_VERIFICATION,
    WORKFLOW_STATES.REUPLOAD_REQUIRED
  ],
  
  [WORKFLOW_STATES.DOCUMENT_VERIFICATION]: [
    WORKFLOW_STATES.WAITING_FINANCE_APPROVAL,
    WORKFLOW_STATES.REUPLOAD_REQUIRED
  ],
  
  [WORKFLOW_STATES.WAITING_FINANCE_APPROVAL]: [
    WORKFLOW_STATES.APPROVED,
    WORKFLOW_STATES.REJECTED
  ],
  
  [WORKFLOW_STATES.APPROVED]: [WORKFLOW_STATES.ERP_SYNC],
  
  [WORKFLOW_STATES.ERP_SYNC]: [WORKFLOW_STATES.COMPLETED],
  
  [WORKFLOW_STATES.REUPLOAD_REQUIRED]: [
    WORKFLOW_STATES.WAITING_GST,
    WORKFLOW_STATES.WAITING_PAN,
    WORKFLOW_STATES.WAITING_BANK_PROOF
  ],
  
  [WORKFLOW_STATES.REJECTED]: [],
  [WORKFLOW_STATES.COMPLETED]: []
};

/**
 * Tool Types
 * 
 * Available tools that the Planner can request to call.
 * The Planner NEVER executes these tools directly.
 * It only requests them via tool_calls in its response.
 */
const TOOL_TYPES = {
  WORKFLOW: 'workflow',
  VENDOR: 'vendor',
  DOCUMENT: 'document',
  CONVERSATION: 'conversation',
  APPROVAL: 'approval',
  NOTIFICATION: 'notification',
  LOGGER: 'logger'
};

/**
 * Tool Actions
 * 
 * Specific actions for each tool type.
 */
const TOOL_ACTIONS = {
  // Workflow tool actions
  WORKFLOW: {
    UPDATE_STATE: 'update_state',
    GET_STATE: 'get_state',
    VALIDATE_TRANSITION: 'validate_transition'
  },
  
  // Vendor tool actions
  VENDOR: {
    CREATE: 'create',
    UPDATE: 'update',
    GET: 'get'
  },
  
  // Document tool actions
  DOCUMENT: {
    SAVE: 'save',
    GET_MISSING: 'get_missing',
    VALIDATE: 'validate',
    LIST: 'list'
  },
  
  // Conversation tool actions
  CONVERSATION: {
    SAVE_MESSAGE: 'save_message',
    GET_HISTORY: 'get_history'
  },
  
  // Approval tool actions
  APPROVAL: {
    CREATE_REQUEST: 'create_request',
    APPROVE: 'approve',
    REJECT: 'reject',
    GET_STATUS: 'get_status'
  },
  
  // Notification tool actions
  NOTIFICATION: {
    PREPARE_MESSAGE: 'prepare_message',
    SEND: 'send'
  },
  
  // Logger tool actions
  LOGGER: {
    LOG_EVENT: 'log_event',
    GET_TIMELINE: 'get_timeline'
  }
};

/**
 * Decision Types
 * 
 * High-level decision categories that the Planner can make.
 */
const DECISION_TYPES = {
  ASK_INFORMATION: 'ASK_INFORMATION',
  REQUEST_DOCUMENT: 'REQUEST_DOCUMENT',
  VALIDATE_DOCUMENT: 'VALIDATE_DOCUMENT',
  REQUEST_APPROVAL: 'REQUEST_APPROVAL',
  UPDATE_STATE: 'UPDATE_STATE',
  INFORM_VENDOR: 'INFORM_VENDOR',
  WAIT: 'WAIT',
  ERROR: 'ERROR'
};

/**
 * Document Types
 * 
 * Required documents for vendor onboarding.
 */
const DOCUMENT_TYPES = {
  GST_CERTIFICATE: 'gst_certificate',
  PAN_CARD: 'pan_card',
  BANK_PROOF: 'bank_proof',
  COMPANY_REGISTRATION: 'company_registration',
  ADDRESS_PROOF: 'address_proof'
};

/**
 * Message Types
 * 
 * Types of messages in conversations.
 */
const MESSAGE_TYPES = {
  TEXT: 'text',
  DOCUMENT: 'document',
  IMAGE: 'image',
  SYSTEM: 'system'
};

/**
 * Error Codes
 * 
 * Standard error codes for Planner operations.
 */
const ERROR_CODES = {
  INVALID_STATE: 'INVALID_STATE',
  MISSING_CONTEXT: 'MISSING_CONTEXT',
  INVALID_TRANSITION: 'INVALID_TRANSITION',
  TOOL_EXECUTION_FAILED: 'TOOL_EXECUTION_FAILED',
  VALIDATION_FAILED: 'VALIDATION_FAILED'
};

module.exports = {
  WORKFLOW_STATES,
  VALID_TRANSITIONS,
  TOOL_TYPES,
  TOOL_ACTIONS,
  DECISION_TYPES,
  DOCUMENT_TYPES,
  MESSAGE_TYPES,
  ERROR_CODES
};
