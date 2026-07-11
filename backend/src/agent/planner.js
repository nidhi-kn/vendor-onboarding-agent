/**
 * planner.js
 * 
 * Core Planner Agent - The decision-making brain of the system.
 * 
 * Responsibilities:
 * - Receive PlannerRequest
 * - Generate prompts
 * - Call Groq API
 * - Validate response
 * - Return PlannerResponse
 * 
 * The Planner NEVER:
 * - Accesses database directly
 * - Sends Telegram messages
 * - Calls APIs
 * - Executes tools
 * 
 * It only decides what should happen.
 */

const groqService = require('../services/groqService');
const { validatePlannerResponse } = require('./plannerSchema');
const { PLANNER_SYSTEM_PROMPT, generateUserPrompt } = require('./plannerPrompt');

class Planner {
  constructor() {
    this.isInitialized = false;
  }

  /**
   * Initialize the Planner
   * Sets up Groq service
   * 
   * @throws {Error} If initialization fails
   */
  initialize() {
    if (this.isInitialized) {
      this.log('warn', 'Planner already initialized');
      return;
    }

    try {
      groqService.initialize();
      this.isInitialized = true;
      this.log('info', 'Planner initialized successfully');
    } catch (error) {
      this.log('error', 'Planner initialization failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Plan next action based on context
   * 
   * @param {Object} request - PlannerRequest object
   * @param {Object} request.vendorContext - Vendor information
   * @param {Object} request.workflowContext - Workflow state
   * @param {Array} request.documents - Uploaded documents
   * @param {Array} request.conversationHistory - Message history
   * @param {Object} request.incomingMessage - Current message
   * @returns {Promise<Object>} PlannerResponse
   * @throws {Error} If planning fails
   */
  async plan(request) {
    this.ensureInitialized();
    this.validateRequest(request);

    const planningId = this.generatePlanningId();
    
    this.log('info', `[${planningId}] Starting planning`, {
      state: request.workflowContext.currentState,
      vendorId: request.vendorContext.vendorId,
      messageType: request.incomingMessage.messageType
    });

    try {
      // Step 1: Build prompts
      const systemPrompt = PLANNER_SYSTEM_PROMPT;
      const userPrompt = generateUserPrompt(request);

      this.log('info', `[${planningId}] Prompts generated`, {
        systemPromptLength: systemPrompt.length,
        userPromptLength: userPrompt.length
      });

      // Step 2: Call Groq
      const rawResponse = await groqService.generate(systemPrompt, userPrompt, {
        temperature: 0.1,
        maxTokens: 2000,
        jsonMode: true
      });

      this.log('info', `[${planningId}] Received Groq response`, {
        responseLength: rawResponse.length
      });

      // Step 3: Parse JSON
      let parsedResponse;
      try {
        parsedResponse = JSON.parse(rawResponse);
      } catch (parseError) {
        this.log('error', `[${planningId}] JSON parse failed`, {
          error: parseError.message
        });
        throw new Error(`Failed to parse Groq response as JSON: ${parseError.message}`);
      }

      // Step 4: Validate schema
      const validation = validatePlannerResponse(parsedResponse);
      
      if (!validation.success) {
        this.log('error', `[${planningId}] Schema validation failed`, {
          errors: validation.error.details
        });
        throw new Error(`Invalid Planner response schema: ${JSON.stringify(validation.error.details)}`);
      }

      const plannerResponse = validation.data;

      this.log('info', `[${planningId}] Planning successful`, {
        decisionType: plannerResponse.decision.type,
        toolCallsCount: plannerResponse.toolCalls.length,
        nextState: plannerResponse.nextState
      });

      return plannerResponse;

    } catch (error) {
      this.log('error', `[${planningId}] Planning failed`, {
        error: error.message,
        stack: error.stack
      });
      
      throw new Error(`Planning failed: ${error.message}`);
    }
  }

  /**
   * Validate PlannerRequest structure
   * @private
   */
  validateRequest(request) {
    if (!request) {
      throw new Error('PlannerRequest is required');
    }

    const requiredFields = [
      'vendorContext',
      'workflowContext',
      'documents',
      'conversationHistory',
      'incomingMessage'
    ];

    for (const field of requiredFields) {
      if (!(field in request)) {
        throw new Error(`PlannerRequest missing required field: ${field}`);
      }
    }

    // Validate workflowContext has required fields
    if (!request.workflowContext.currentState) {
      throw new Error('workflowContext.currentState is required');
    }

    if (!request.workflowContext.workflowId) {
      throw new Error('workflowContext.workflowId is required');
    }

    // Validate incomingMessage - allow either text content OR document attachment
    if (!request.incomingMessage.messageType) {
      throw new Error('incomingMessage.messageType is required');
    }

    const hasText = request.incomingMessage.content && request.incomingMessage.content.trim().length > 0;
    const hasDocument = request.incomingMessage.documentUrl || request.incomingMessage.documentType;
    
    if (!hasText && !hasDocument) {
      throw new Error('incomingMessage must have either content or a document attachment');
    }
  }

  /**
   * Ensure Planner is initialized
   * @private
   */
  ensureInitialized() {
    if (!this.isInitialized) {
      throw new Error('Planner not initialized. Call initialize() first.');
    }
  }

  /**
   * Generate unique planning ID
   * @private
   */
  generatePlanningId() {
    return `plan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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
      service: 'Planner',
      message,
      ...metadata
    };

    const logMethod = level === 'error' ? console.error : console.log;
    logMethod(JSON.stringify(logEntry));
  }
}

// Export singleton instance
module.exports = new Planner();
