/**
 * agentLoop.js
 * 
 * Agent Loop - Orchestrates the planning cycle
 * 
 * Flow:
 * 1. Receive input (PlannerRequest)
 * 2. Call Planner
 * 3. Validate response
 * 4. Return PlannerResponse
 * 
 * This is a simple orchestration layer.
 * The actual decision-making happens in planner.js
 */

const planner = require('./planner');
const { validatePlannerResponse } = require('./plannerSchema');

/**
 * Execute the agent loop
 * 
 * @param {Object} request - PlannerRequest
 * @returns {Promise<Object>} PlannerResponse
 * @throws {Error} If loop execution fails
 */
async function executeAgentLoop(request) {
  const loopId = generateLoopId();
  
  log('info', `[${loopId}] Agent loop started`, {
    vendorId: request.vendorContext?.vendorId,
    state: request.workflowContext?.currentState
  });

  try {
    // Step 1: Validate input structure
    validateInput(request);

    // Step 2: Call Planner
    const plannerResponse = await planner.plan(request);

    // Step 3: Additional validation (defensive)
    const validation = validatePlannerResponse(plannerResponse);
    if (!validation.success) {
      throw new Error('Planner returned invalid response');
    }

    log('info', `[${loopId}] Agent loop completed successfully`, {
      decisionType: plannerResponse.decision.type,
      toolCallsCount: plannerResponse.toolCalls.length
    });

    return plannerResponse;

  } catch (error) {
    log('error', `[${loopId}] Agent loop failed`, {
      error: error.message,
      stack: error.stack
    });
    
    throw error;
  }
}

/**
 * Initialize the agent loop
 * Must be called before executeAgentLoop
 */
function initialize() {
  log('info', 'Initializing agent loop');
  
  try {
    planner.initialize();
    log('info', 'Agent loop initialized successfully');
  } catch (error) {
    log('error', 'Agent loop initialization failed', { error: error.message });
    throw error;
  }
}

/**
 * Validate input structure
 * @private
 */
function validateInput(request) {
  if (!request) {
    throw new Error('Request is required');
  }

  if (!request.vendorContext) {
    throw new Error('vendorContext is required');
  }

  if (!request.workflowContext) {
    throw new Error('workflowContext is required');
  }

  if (!Array.isArray(request.documents)) {
    throw new Error('documents must be an array');
  }

  if (!Array.isArray(request.conversationHistory)) {
    throw new Error('conversationHistory must be an array');
  }

  if (!request.incomingMessage) {
    throw new Error('incomingMessage is required');
  }
}

/**
 * Generate unique loop ID
 * @private
 */
function generateLoopId() {
  return `loop_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Logger
 * @private
 */
function log(level, message, metadata = {}) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    service: 'AgentLoop',
    message,
    ...metadata
  };

  const logMethod = level === 'error' ? console.error : console.log;
  logMethod(JSON.stringify(logEntry));
}

module.exports = {
  executeAgentLoop,
  initialize
};
