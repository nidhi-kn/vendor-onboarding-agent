/**
 * plannerTypes.js
 * 
 * Type definitions and interfaces for the Planner Agent.
 * These types define the contracts between the Planner and other components.
 * 
 * All types are defined using JSDoc for documentation and IDE support.
 * In a TypeScript project, these would be .ts interfaces.
 */

/**
 * @typedef {Object} VendorContext
 * @property {string|null} vendorId - Unique identifier for the vendor
 * @property {string|null} companyName - Name of the vendor company
 * @property {string|null} contactPerson - Primary contact person name
 * @property {string|null} email - Vendor email address
 * @property {string|null} phone - Vendor phone number
 * @property {string|null} gstNumber - GST registration number
 * @property {string|null} panNumber - PAN card number
 * @property {string|null} bankAccountNumber - Bank account number
 * @property {string|null} ifscCode - Bank IFSC code
 * @property {Object|null} metadata - Additional vendor information
 */

/**
 * @typedef {Object} WorkflowContext
 * @property {string} workflowId - Unique identifier for this workflow instance
 * @property {string} currentState - Current workflow state (from WORKFLOW_STATES)
 * @property {string|null} previousState - Previous workflow state
 * @property {string[]} stateHistory - Array of all states visited
 * @property {Date} createdAt - When workflow was created
 * @property {Date} updatedAt - When workflow was last updated
 * @property {Object} metadata - Additional workflow information
 * @property {string|null} assignedTo - Finance approver if in approval state
 */

/**
 * @typedef {Object} Document
 * @property {string} documentId - Unique identifier for the document
 * @property {string} documentType - Type of document (from DOCUMENT_TYPES)
 * @property {string} fileName - Original file name
 * @property {string} fileUrl - Storage URL for the document
 * @property {string} mimeType - MIME type (e.g., 'application/pdf')
 * @property {number} fileSize - File size in bytes
 * @property {Date} uploadedAt - When document was uploaded
 * @property {string} uploadedBy - Vendor ID or user who uploaded
 * @property {string} status - Validation status ('pending', 'verified', 'rejected')
 * @property {string|null} rejectionReason - Reason if document was rejected
 */

/**
 * @typedef {Object} ConversationMessage
 * @property {string} messageId - Unique identifier for the message
 * @property {string} messageType - Type of message (from MESSAGE_TYPES)
 * @property {string} content - Message text content
 * @property {string} sender - Who sent the message ('vendor', 'system', 'approver')
 * @property {Date} timestamp - When message was sent
 * @property {Object|null} metadata - Additional message data (e.g., document reference)
 */

/**
 * @typedef {Object} IncomingMessage
 * @property {string} messageType - Type of incoming message
 * @property {string} content - Message content
 * @property {string} senderId - ID of the sender
 * @property {string} senderName - Name of the sender
 * @property {Date} timestamp - When message was received
 * @property {string|null} documentUrl - URL if message contains a document
 * @property {string|null} documentType - Type of document if applicable
 */

/**
 * @typedef {Object} PlannerRequest
 * @property {VendorContext} vendorContext - Current vendor information
 * @property {WorkflowContext} workflowContext - Current workflow state
 * @property {Document[]} documents - List of uploaded documents
 * @property {ConversationMessage[]} conversationHistory - Recent conversation messages
 * @property {IncomingMessage} incomingMessage - The message that triggered this planning
 */

/**
 * @typedef {Object} ToolCall
 * @property {string} tool - Tool name (from TOOL_TYPES)
 * @property {string} action - Specific action to perform (from TOOL_ACTIONS)
 * @property {Object} parameters - Parameters required for the tool action
 * @property {string} [parameters.state] - For workflow.update_state
 * @property {Object} [parameters.vendorData] - For vendor.update
 * @property {string} [parameters.documentType] - For document operations
 * @property {string} [parameters.message] - For conversation.save_message
 */

/**
 * @typedef {Object} Decision
 * @property {string} type - Decision type (from DECISION_TYPES)
 * @property {string} description - Human-readable description of the decision
 * @property {Object} [parameters] - Additional parameters for the decision
 */

/**
 * @typedef {Object} PlannerResponse
 * @property {string} reasoning - Detailed explanation of why this decision was made
 * @property {Decision} decision - High-level decision made by the Planner
 * @property {ToolCall[]} toolCalls - Array of tools to execute (can be empty)
 * @property {string} responseMessage - Message to send back to the vendor
 * @property {string|null} nextState - Next workflow state (if state transition required)
 * @property {Object} metadata - Additional metadata about this planning cycle
 * @property {Date} metadata.timestamp - When this response was generated
 * @property {string} metadata.model - AI model used for planning
 */

/**
 * Example PlannerRequest:
 * 
 * {
 *   vendorContext: {
 *     vendorId: 'v_123',
 *     companyName: 'Acme Corp',
 *     contactPerson: 'John Doe',
 *     email: 'john@acme.com',
 *     phone: '+919876543210',
 *     gstNumber: null,
 *     panNumber: null,
 *     bankAccountNumber: null,
 *     ifscCode: null,
 *     metadata: {}
 *   },
 *   workflowContext: {
 *     workflowId: 'wf_123',
 *     currentState: 'WAITING_GST',
 *     previousState: 'WAITING_VENDOR_DETAILS',
 *     stateHistory: ['START', 'WAITING_VENDOR_DETAILS', 'WAITING_GST'],
 *     createdAt: '2024-01-01T00:00:00Z',
 *     updatedAt: '2024-01-01T00:05:00Z',
 *     metadata: {},
 *     assignedTo: null
 *   },
 *   documents: [],
 *   conversationHistory: [
 *     {
 *       messageId: 'msg_1',
 *       messageType: 'text',
 *       content: 'Hi, I want to register as a vendor',
 *       sender: 'vendor',
 *       timestamp: '2024-01-01T00:00:00Z',
 *       metadata: null
 *     }
 *   ],
 *   incomingMessage: {
 *     messageType: 'text',
 *     content: 'How do I proceed?',
 *     senderId: 'v_123',
 *     senderName: 'John Doe',
 *     timestamp: '2024-01-01T00:05:00Z',
 *     documentUrl: null,
 *     documentType: null
 *   }
 * }
 */

/**
 * Example PlannerResponse:
 * 
 * {
 *   reasoning: 'Vendor is in WAITING_GST state and asked how to proceed. Need to explain GST upload requirement.',
 *   decision: {
 *     type: 'REQUEST_DOCUMENT',
 *     description: 'Request vendor to upload GST certificate',
 *     parameters: { documentType: 'gst_certificate' }
 *   },
 *   toolCalls: [
 *     {
 *       tool: 'conversation',
 *       action: 'save_message',
 *       parameters: {
 *         message: 'Please upload your GST certificate...',
 *         sender: 'system'
 *       }
 *     },
 *     {
 *       tool: 'logger',
 *       action: 'log_event',
 *       parameters: {
 *         event: 'gst_requested',
 *         description: 'Requested GST certificate from vendor'
 *       }
 *     }
 *   ],
 *   responseMessage: 'Please upload your GST certificate as a PDF or image. This is required to verify your company registration.',
 *   nextState: null,
 *   metadata: {
 *     timestamp: '2024-01-01T00:05:01Z',
 *     model: 'llama-3.3-70b-versatile'
 *   }
 * }
 */

// Export empty object since this file only contains JSDoc type definitions
// In TypeScript, this would export actual interfaces
module.exports = {};
