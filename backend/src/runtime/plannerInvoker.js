/**
 * plannerInvoker.js
 * 
 * Wrapper for planner invocation with retry and timeout handling.
 * Runtime never calls planner.js directly - always through this invoker.
 * 
 * Responsibilities:
 * - Invoke planner.plan()
 * - Persist AgentRun for observability
 * - Handle retries on transient failures
 * - Handle timeout
 * - Surface planner errors with context
 */

const planner = require('../agent/planner');
const agentRunRepository = require('../repositories/agentRunRepository');

class PlannerInvoker {
  constructor() {
    this.config = {
      maxRetries: 2,
      retryDelay: 1000,
      timeout: 45000 // 45 seconds
    };
  }

  /**
   * Initialize planner
   */
  initialize() {
    planner.initialize();
  }

  /**
   * Invoke planner with retry and timeout
   * 
   * @param {Object} plannerRequest - Complete planner input
   * @param {Object} options - Invocation options
   * @returns {Promise<Object>} Planner response
   * @throws {Error} If invocation fails after retries
   */
  async invoke(plannerRequest, options = {}) {
    const {
      timeout = this.config.timeout,
      maxRetries = this.config.maxRetries
    } = options;

    const startTime = Date.now();
    
    // Create AgentRun record
    const agentRun = await agentRunRepository.create({
      workflowId: plannerRequest.workflowContext.workflowId,
      plannerInput: plannerRequest,
      status: 'pending',
      promptVersion: 'v1'
    });

    let lastError = null;
    let attempt = 0;

    while (attempt < maxRetries) {
      attempt++;

      try {
        this.log('info', `Invoking planner (attempt ${attempt}/${maxRetries})`, {
          agentRunId: agentRun.id
        });

        const result = await this.executeWithTimeout(
          () => planner.plan(plannerRequest),
          timeout
        );

        const latencyMs = Date.now() - startTime;

        // Update AgentRun with success
        await agentRunRepository.complete(agentRun.id, {
          plannerOutput: result,
          reasoning: result.reasoning,
          decision: result.decision,
          toolCallsCount: result.toolCalls?.length || 0,
          status: 'success',
          latencyMs
        });

        this.log('info', `Planner invocation successful (attempt ${attempt})`, {
          agentRunId: agentRun.id,
          latencyMs
        });
        
        return result;

      } catch (error) {
        lastError = error;
        
        this.log('error', `Planner invocation failed (attempt ${attempt})`, {
          agentRunId: agentRun.id,
          error: error.message
        });

        if (attempt < maxRetries && this.isRetryable(error)) {
          const delay = this.config.retryDelay * attempt;
          this.log('info', `Retrying in ${delay}ms`);
          await this.sleep(delay);
        } else {
          break;
        }
      }
    }

    // All retries exhausted - update AgentRun with error
    const latencyMs = Date.now() - startTime;
    await agentRunRepository.complete(agentRun.id, {
      status: 'error',
      errorMessage: lastError.message,
      latencyMs
    });

    throw new Error(
      `Planner invocation failed after ${attempt} attempts: ${lastError.message}`
    );
  }

  /**
   * Execute function with timeout
   * @private
   */
  async executeWithTimeout(fn, timeoutMs) {
    return Promise.race([
      fn(),
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error(`Planner timeout after ${timeoutMs}ms`)),
          timeoutMs
        )
      )
    ]);
  }

  /**
   * Check if error is retryable
   * @private
   */
  isRetryable(error) {
    const retryableMessages = [
      'timeout',
      'rate limit',
      'server error',
      'ECONNRESET',
      'ETIMEDOUT'
    ];

    return retryableMessages.some(msg =>
      error.message.toLowerCase().includes(msg.toLowerCase())
    );
  }

  /**
   * Sleep utility
   * @private
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
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
      service: 'PlannerInvoker',
      message,
      ...metadata
    };

    const logMethod = level === 'error' ? console.error : console.log;
    logMethod(JSON.stringify(logEntry));
  }
}

// Export singleton
module.exports = new PlannerInvoker();
