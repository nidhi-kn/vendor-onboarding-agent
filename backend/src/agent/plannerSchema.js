/**
 * plannerSchema.js
 * 
 * Zod validation schemas for Planner Agent inputs and outputs.
 * These schemas ensure that data flowing in and out of the Planner
 * adheres to the expected structure and types.
 * 
 * Used for:
 * - Runtime validation of Planner responses
 * - Catching errors before they propagate
 * - Self-documenting API contracts
 */

const { z } = require('zod');
const {
  WORKFLOW_STATES,
  TOOL_TYPES,
  TOOL_ACTIONS,
  DECISION_TYPES,
  DOCUMENT_TYPES,
  MESSAGE_TYPES
} = require('./constants');

/**
 * Schema for tool call parameters
 * Flexible object that can contain any parameters needed by tools
 */
const ToolCallParametersSchema = z.object({
  state: z.string().optional(),
  vendorData: z.record(z.any()).optional(),
  documentType: z.string().optional(),
  message: z.string().optional(),
  event: z.string().optional(),
  description: z.string().optional()
}).passthrough(); // Allow additional fields

/**
 * Schema for a single tool call
 * Represents one tool execution request from the Planner
 */
const ToolCallSchema = z.object({
  tool: z.enum([
    TOOL_TYPES.WORKFLOW,
    TOOL_TYPES.VENDOR,
    TOOL_TYPES.DOCUMENT,
    TOOL_TYPES.CONVERSATION,
    TOOL_TYPES.APPROVAL,
    TOOL_TYPES.NOTIFICATION,
    TOOL_TYPES.LOGGER
  ]).describe('Tool to execute'),
  
  action: z.string().describe('Specific action to perform on the tool'),
  
  parameters: ToolCallParametersSchema.describe('Parameters for the tool action')
});

/**
 * Schema for the decision object
 * Represents the high-level decision made by the Planner
 */
const DecisionSchema = z.object({
  type: z.enum([
    DECISION_TYPES.ASK_INFORMATION,
    DECISION_TYPES.REQUEST_DOCUMENT,
    DECISION_TYPES.VALIDATE_DOCUMENT,
    DECISION_TYPES.REQUEST_APPROVAL,
    DECISION_TYPES.UPDATE_STATE,
    DECISION_TYPES.INFORM_VENDOR,
    DECISION_TYPES.WAIT,
    DECISION_TYPES.ERROR
  ]).describe('Type of decision made'),
  
  description: z.string().min(1).describe('Human-readable description of the decision'),
  
  parameters: z.record(z.any()).optional().describe('Additional parameters for the decision')
});

/**
 * Schema for metadata in Planner response
 */
const MetadataSchema = z.object({
  timestamp: z.string().or(z.date()).describe('When this response was generated'),
  model: z.string().optional().describe('AI model used for planning')
}).passthrough(); // Allow additional metadata fields

/**
 * Main schema for Planner Response
 * This is the core contract that every Planner output must satisfy
 */
const PlannerResponseSchema = z.object({
  reasoning: z.string()
    .min(10)
    .describe('Detailed explanation of why this decision was made. Must be at least 10 characters.'),
  
  decision: DecisionSchema
    .describe('High-level decision made by the Planner'),
  
  toolCalls: z.array(ToolCallSchema)
    .describe('Array of tools to execute. Can be empty if no tools needed.'),
  
  responseMessage: z.string()
    .min(1)
    .describe('Message to send back to the vendor. Must not be empty.'),
  
  nextState: z.enum([
    WORKFLOW_STATES.START,
    WORKFLOW_STATES.WAITING_VENDOR_DETAILS,
    WORKFLOW_STATES.WAITING_GST,
    WORKFLOW_STATES.WAITING_PAN,
    WORKFLOW_STATES.WAITING_BANK_PROOF,
    WORKFLOW_STATES.DOCUMENT_VERIFICATION,
    WORKFLOW_STATES.WAITING_FINANCE_APPROVAL,
    WORKFLOW_STATES.APPROVED,
    WORKFLOW_STATES.ERP_SYNC,
    WORKFLOW_STATES.COMPLETED,
    WORKFLOW_STATES.REUPLOAD_REQUIRED,
    WORKFLOW_STATES.REJECTED
  ]).nullable()
    .describe('Next workflow state if state transition is required, null otherwise'),
  
  metadata: MetadataSchema
    .describe('Additional metadata about this planning cycle')
});

/**
 * Validate a Planner response
 * 
 * @param {Object} response - Response object to validate
 * @returns {{ success: boolean, data?: Object, error?: Object }} Validation result
 * 
 * @example
 * const result = validatePlannerResponse(plannerOutput);
 * if (!result.success) {
 *   console.error('Invalid response:', result.error);
 * }
 */
function validatePlannerResponse(response) {
  try {
    const validated = PlannerResponseSchema.parse(response);
    return {
      success: true,
      data: validated
    };
  } catch (error) {
    return {
      success: false,
      error: {
        message: 'Planner response validation failed',
        details: error.errors || error.message
      }
    };
  }
}

/**
 * Validate a single tool call
 * 
 * @param {Object} toolCall - Tool call object to validate
 * @returns {{ success: boolean, data?: Object, error?: Object }} Validation result
 */
function validateToolCall(toolCall) {
  try {
    const validated = ToolCallSchema.parse(toolCall);
    return {
      success: true,
      data: validated
    };
  } catch (error) {
    return {
      success: false,
      error: {
        message: 'Tool call validation failed',
        details: error.errors || error.message
      }
    };
  }
}

/**
 * Validate a decision object
 * 
 * @param {Object} decision - Decision object to validate
 * @returns {{ success: boolean, data?: Object, error?: Object }} Validation result
 */
function validateDecision(decision) {
  try {
    const validated = DecisionSchema.parse(decision);
    return {
      success: true,
      data: validated
    };
  } catch (error) {
    return {
      success: false,
      error: {
        message: 'Decision validation failed',
        details: error.errors || error.message
      }
    };
  }
}

/**
 * Safe parse that returns both success and error information
 * 
 * @param {Object} response - Response to validate
 * @returns {Object} Parse result with success flag and data/error
 */
function safeParsePlannerResponse(response) {
  const result = PlannerResponseSchema.safeParse(response);
  return result;
}

module.exports = {
  // Schemas
  PlannerResponseSchema,
  ToolCallSchema,
  DecisionSchema,
  MetadataSchema,
  ToolCallParametersSchema,
  
  // Validation functions
  validatePlannerResponse,
  validateToolCall,
  validateDecision,
  safeParsePlannerResponse
};
