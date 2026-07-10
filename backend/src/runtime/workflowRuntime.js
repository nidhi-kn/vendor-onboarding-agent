/**
 * workflowRuntime.js
 * 
 * Main orchestration layer for workflow execution.
 * Coordinates the complete lifecycle of a workflow event.
 * 
 * Flow:
 * 1. Accept WorkflowEvent
 * 2. Build context
 * 3. Invoke planner
 * 4. Validate response
 * 5. Validate state transition
 * 6. Dispatch execution plan
 * 7. Return WorkflowResult
 * 
 * Does NOT execute tools - prepares for Phase 3.
 */

const contextBuilder = require('./workflowContextBuilder');
const plannerInvoker = require('./plannerInvoker');
const plannerValidator = require('./plannerValidator');
const stateMachine = require('./workflowStateMachine');
const dispatcher = require('./workflowDispatcher');
const toolExecutor = require('../executor/toolExecutor');

class WorkflowRuntime {
  constructor() {
    this.isInitialized = false;
  }

  /**
   * Initialize the workflow runtime
   */
  initialize() {
    if (this.isInitialized) {
      this.log('warn', 'WorkflowRuntime already initialized');
      return;
    }

    try {
      plannerInvoker.initialize();
      this.isInitialized = true;
      this.log('info', 'WorkflowRuntime initialized successfully');
    } catch (error) {
      this.log('error', 'WorkflowRuntime initialization failed', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Execute workflow event
   * 
   * @param {Object} workflowEvent - Incoming event
   * @param {string} workflowEvent.workflowId - Workflow identifier
   * @param {string} workflowEvent.trigger - Event trigger type
   * @param {Object} workflowEvent.incomingMessage - Message that triggered event
   * @returns {Promise<Object>} WorkflowResult
   */
  async execute(workflowEvent) {
    this.ensureInitialized();
    
    const runtimeId = this.generateRuntimeId();
    const startTime = Date.now();

    this.logEvent('RuntimeStarted', runtimeId, {
      workflowId: workflowEvent.workflowId,
      trigger: workflowEvent.trigger
    });

    try {
      // Step 1: Build execution context
      this.logEvent('ContextBuildStarted', runtimeId);
      
      const plannerRequest = await contextBuilder.buildPlannerInput(workflowEvent);
      
      this.logEvent('ContextBuilt', runtimeId, {
        currentState: plannerRequest.workflowContext.currentState,
        documentsCount: plannerRequest.documents.length
      });

      // Step 2: Invoke planner
      this.logEvent('PlannerInvoked', runtimeId);
      
      const plannerResponse = await plannerInvoker.invoke(plannerRequest);
      
      this.logEvent('PlannerCompleted', runtimeId, {
        decisionType: plannerResponse.decision.type,
        toolCallsCount: plannerResponse.toolCalls.length
      });

      // Step 3: Validate planner response
      this.logEvent('PlannerValidationStarted', runtimeId);
      
      const validation = plannerValidator.validate(plannerResponse);
      
      if (!validation.success) {
        throw new Error(
          `Planner validation failed: ${JSON.stringify(validation.errors)}`
        );
      }

      this.logEvent('PlannerValidated', runtimeId, {
        confidence: validation.confidenceScore
      });

      // Step 4: Validate state transition
      const currentState = plannerRequest.workflowContext.currentState;
      const nextState = plannerResponse.nextState;

      if (nextState) {
        this.logEvent('StateValidationStarted', runtimeId, {
          from: currentState,
          to: nextState
        });

        const stateValidation = stateMachine.validateTransition(currentState, nextState);

        if (!stateValidation.valid) {
          throw new Error(
            `Invalid state transition: ${stateValidation.error}. ` +
            `Allowed: ${stateValidation.allowedStates.join(', ')}`
          );
        }

        this.logEvent('StateValidated', runtimeId, {
          transition: `${currentState} -> ${nextState}`
        });
      }

      // Step 5: Dispatch execution plan
      this.logEvent('ExecutionPlanPreparationStarted', runtimeId);
      
      const executionPlan = dispatcher.dispatch(
        plannerResponse,
        plannerRequest.workflowContext
      );

      this.logEvent('ExecutionPlanPrepared', runtimeId, {
        tasksCount: executionPlan.executionTasks.length,
        nextState: executionPlan.nextState
      });

      // Step 6: Execute tools (NEW - Phase 3)
      this.logEvent('ToolExecutionStarted', runtimeId);
      
      const executionResult = await toolExecutor.execute(executionPlan);

      this.logEvent('ToolExecutionCompleted', runtimeId, {
        success: executionResult.success,
        resultsCount: executionResult.results.length,
        errorsCount: executionResult.errors.length,
        duration: executionResult.executionTime
      });

      // Step 7: Build workflow result
      const duration = Date.now() - startTime;

      const workflowResult = {
        status: 'success',
        currentState: currentState,
        nextState: executionPlan.nextState,
        plannerResponse: plannerResponse,
        executionPlan: executionPlan,
        executionResult: executionResult,
        metadata: {
          runtimeId,
          duration,
          timestamp: new Date().toISOString(),
          validation: {
            confidence: validation.confidenceScore,
            errors: validation.errors
          }
        }
      };

      this.logEvent('RuntimeCompleted', runtimeId, {
        duration,
        status: 'success'
      });

      return workflowResult;

    } catch (error) {
      const duration = Date.now() - startTime;

      this.logEvent('RuntimeFailed', runtimeId, {
        error: error.message,
        duration
      });

      return {
        status: 'error',
        currentState: null,
        nextState: null,
        plannerResponse: null,
        executionPlan: null,
        metadata: {
          runtimeId,
          duration,
          timestamp: new Date().toISOString(),
          error: {
            message: error.message,
            stack: error.stack
          }
        }
      };
    }
  }

  /**
   * Ensure runtime is initialized
   * @private
   */
  ensureInitialized() {
    if (!this.isInitialized) {
      throw new Error('WorkflowRuntime not initialized. Call initialize() first.');
    }
  }

  /**
   * Generate unique runtime ID
   * @private
   */
  generateRuntimeId() {
    return `runtime_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Log structured event
   * @private
   */
  logEvent(event, runtimeId, metadata = {}) {
    this.log('info', event, {
      runtimeId,
      ...metadata
    });
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
      service: 'WorkflowRuntime',
      message,
      ...metadata
    };

    const logMethod = level === 'error' ? console.error : console.log;
    logMethod(JSON.stringify(logEntry));
  }
}

// Export singleton
module.exports = new WorkflowRuntime();
