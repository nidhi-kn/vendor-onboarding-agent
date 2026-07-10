const Groq = require('groq-sdk');
require('dotenv').config();

/**
 * GroqService - Production-grade Groq API integration layer
 * 
 * Features:
 * - Automatic retry with exponential backoff
 * - Request timeout handling
 * - Comprehensive error handling
 * - Structured logging
 * - Health check endpoint
 * 
 * This service is a pure infrastructure layer.
 * It does NOT contain business logic.
 */
class GroqService {
  constructor() {
    this.client = null;
    this.model = 'llama-3.3-70b-versatile';
    this.isInitialized = false;
    
    // Configuration
    this.config = {
      maxRetries: 3,
      retryDelay: 1000, // Initial delay in ms
      timeout: 30000, // 30 seconds
      defaultTemperature: 0.1,
      defaultMaxTokens: 2000
    };
  }

  /**
   * Initialize the Groq client
   * Must be called before using generate() or healthCheck()
   * 
   * @throws {Error} If GROQ_API_KEY is not set
   */
  initialize() {
    if (this.isInitialized) {
      this.log('warn', 'GroqService already initialized');
      return;
    }

    const apiKey = process.env.GROQ_API_KEY;
    
    if (!apiKey || apiKey === 'your_groq_api_key_here') {
      throw new Error(
        'GROQ_API_KEY not configured. Please set it in your .env file.\n' +
        'Get your API key from: https://console.groq.com'
      );
    }

    this.client = new Groq({ apiKey });
    this.isInitialized = true;
    this.log('info', 'GroqService initialized successfully');
  }

  /**
   * Generate completion from Groq
   * 
   * @param {string} systemPrompt - System instructions
   * @param {string} userPrompt - User message
   * @param {Object} options - Generation options
   * @param {number} [options.temperature] - Sampling temperature (0-2)
   * @param {number} [options.maxTokens] - Maximum tokens to generate
   * @param {boolean} [options.jsonMode] - Force JSON output (default: true)
   * @param {number} [options.timeout] - Request timeout in ms
   * @returns {Promise<string>} Raw LLM response content
   * @throws {Error} If generation fails after retries
   */
  async generate(systemPrompt, userPrompt, options = {}) {
    this.ensureInitialized();
    this.validateInputs(systemPrompt, userPrompt);

    const {
      temperature = this.config.defaultTemperature,
      maxTokens = this.config.defaultMaxTokens,
      jsonMode = true,
      timeout = this.config.timeout
    } = options;

    const requestId = this.generateRequestId();
    this.log('info', `[${requestId}] Starting generation`, {
      systemPromptLength: systemPrompt.length,
      userPromptLength: userPrompt.length,
      temperature,
      maxTokens,
      jsonMode
    });

    let lastError = null;

    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        const result = await this.executeWithTimeout(
          () => this.callGroqAPI(systemPrompt, userPrompt, {
            temperature,
            maxTokens,
            jsonMode
          }),
          timeout,
          requestId
        );

        this.log('info', `[${requestId}] Generation successful`, {
          attempt,
          responseLength: result.length
        });

        return result;

      } catch (error) {
        lastError = error;
        const shouldRetry = this.shouldRetry(error, attempt);

        this.log('error', `[${requestId}] Attempt ${attempt} failed`, {
          error: error.message,
          shouldRetry
        });

        if (!shouldRetry) {
          break;
        }

        if (attempt < this.config.maxRetries) {
          const delay = this.calculateRetryDelay(attempt);
          this.log('info', `[${requestId}] Retrying in ${delay}ms`);
          await this.sleep(delay);
        }
      }
    }

    // All retries exhausted
    this.log('error', `[${requestId}] All retries exhausted`);
    throw this.wrapError(lastError);
  }

  /**
   * Health check - verifies Groq API connectivity
   * 
   * @returns {Promise<Object>} Health status
   * @returns {boolean} return.healthy - Service health status
   * @returns {string} return.message - Status message
   * @returns {number} return.latency - Response time in ms
   */
  async healthCheck() {
    this.ensureInitialized();

    const startTime = Date.now();
    
    try {
      await this.client.chat.completions.create({
        messages: [
          { role: 'system', content: 'You are a test assistant.' },
          { role: 'user', content: 'Respond with: OK' }
        ],
        model: this.model,
        max_tokens: 10,
        temperature: 0
      });

      const latency = Date.now() - startTime;

      return {
        healthy: true,
        message: 'Groq API is reachable',
        latency,
        model: this.model
      };

    } catch (error) {
      const latency = Date.now() - startTime;

      return {
        healthy: false,
        message: error.message,
        latency,
        error: this.categorizeError(error)
      };
    }
  }

  /**
   * Call Groq API (internal method)
   * @private
   */
  async callGroqAPI(systemPrompt, userPrompt, options) {
    const requestPayload = {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      model: this.model,
      temperature: options.temperature,
      max_tokens: options.maxTokens
    };

    if (options.jsonMode) {
      requestPayload.response_format = { type: 'json_object' };
    }

    const completion = await this.client.chat.completions.create(requestPayload);
    const content = completion.choices[0]?.message?.content;

    if (!content) {
      throw new Error('Empty response from Groq API');
    }

    return content;
  }

  /**
   * Execute function with timeout
   * @private
   */
  async executeWithTimeout(fn, timeoutMs, requestId) {
    return Promise.race([
      fn(),
      new Promise((_, reject) => 
        setTimeout(
          () => reject(new Error(`Request timeout after ${timeoutMs}ms`)),
          timeoutMs
        )
      )
    ]);
  }

  /**
   * Determine if error is retryable
   * @private
   */
  shouldRetry(error, attempt) {
    if (attempt >= this.config.maxRetries) {
      return false;
    }

    // Retry on rate limits, timeouts, and server errors
    const retryableStatuses = [429, 500, 502, 503, 504];
    const isRetryable = 
      retryableStatuses.includes(error.status) ||
      error.message.includes('timeout') ||
      error.message.includes('ECONNRESET') ||
      error.message.includes('ETIMEDOUT');

    return isRetryable;
  }

  /**
   * Calculate exponential backoff delay
   * @private
   */
  calculateRetryDelay(attempt) {
    const exponentialDelay = this.config.retryDelay * Math.pow(2, attempt - 1);
    const jitter = Math.random() * 1000; // Add jitter to prevent thundering herd
    return Math.min(exponentialDelay + jitter, 10000); // Cap at 10 seconds
  }

  /**
   * Categorize error for better handling
   * @private
   */
  categorizeError(error) {
    if (error.status === 401) return 'authentication';
    if (error.status === 429) return 'rate_limit';
    if (error.status >= 500) return 'server_error';
    if (error.message.includes('timeout')) return 'timeout';
    return 'unknown';
  }

  /**
   * Wrap error with additional context
   * @private
   */
  wrapError(error) {
    const category = this.categorizeError(error);
    
    const errorMessages = {
      authentication: 'Invalid Groq API key. Check your .env configuration.',
      rate_limit: 'Groq API rate limit exceeded. Please try again later.',
      server_error: 'Groq API is experiencing issues. Please try again.',
      timeout: 'Request timed out. The API might be slow or unresponsive.',
      unknown: `Groq API error: ${error.message}`
    };

    const wrappedError = new Error(errorMessages[category] || error.message);
    wrappedError.originalError = error;
    wrappedError.category = category;
    
    return wrappedError;
  }

  /**
   * Validate inputs
   * @private
   */
  validateInputs(systemPrompt, userPrompt) {
    if (!systemPrompt || typeof systemPrompt !== 'string') {
      throw new Error('systemPrompt must be a non-empty string');
    }
    
    if (!userPrompt || typeof userPrompt !== 'string') {
      throw new Error('userPrompt must be a non-empty string');
    }

    if (systemPrompt.length > 100000) {
      throw new Error('systemPrompt too long (max 100k characters)');
    }

    if (userPrompt.length > 100000) {
      throw new Error('userPrompt too long (max 100k characters)');
    }
  }

  /**
   * Ensure service is initialized
   * @private
   */
  ensureInitialized() {
    if (!this.isInitialized) {
      throw new Error('GroqService not initialized. Call initialize() first.');
    }
  }

  /**
   * Generate unique request ID
   * @private
   */
  generateRequestId() {
    return `groq_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Simple logger
   * @private
   */
  log(level, message, metadata = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      service: 'GroqService',
      message,
      ...metadata
    };

    const logMethod = level === 'error' ? console.error : console.log;
    logMethod(JSON.stringify(logEntry));
  }

  /**
   * Sleep utility
   * @private
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
module.exports = new GroqService();
