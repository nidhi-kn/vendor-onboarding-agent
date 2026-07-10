/**
 * plannerInvoker.js
 * 
 * Wrapper for planner invocation with retry and timeout handling.
 * Runtime never calls planner.js directly - always through this invoker.
 * 
 * Responsibilities:
 * - Invoke planner.plan()
 * - Handle retries on transient failures
 * - Handle timeout
 * - Surface planner errors with context
 */

const planner = require('../agent/planner');

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

    let lastError = null;
    let attempt = 0;

    while (attempt < maxRetries) {
      attempt++;

      try {
        this.log('info', `Invoking planner (attempt ${attempt}/${maxRetries})`);

        const result = await this.executeWithTimeout(
          () => planner.plan(plannerRequest),
          timeout
        );

        this.log('info', `Planner invocation successful (attempt ${attempt})`);
        return result;

      } catch (error) {
        lastError = error;
        
        this.log('error', `Planner invocation failed (attempt ${attempt})`, {
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

    // All retries exhausted
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
