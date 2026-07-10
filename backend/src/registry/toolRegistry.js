/**
 * toolRegistry.js
 * 
 * Central registry for all business tools.
 * Provides tool lookup and validation.
 * 
 * Extensible: New tools only require registration.
 * No switch statements or if-else chains in executor.
 */

class ToolRegistry {
  constructor() {
    this.tools = new Map();
  }

  /**
   * Register a tool
   * 
   * @param {string} name - Tool name (e.g., 'vendor', 'document')
   * @param {Object} toolInstance - Tool instance with execute() method
   * @throws {Error} If tool name already registered or invalid
   */
  register(name, toolInstance) {
    if (!name || typeof name !== 'string') {
      throw new Error('Tool name must be a non-empty string');
    }

    if (!toolInstance || typeof toolInstance.execute !== 'function') {
      throw new Error(`Tool ${name} must have an execute() method`);
    }

    if (this.tools.has(name)) {
      throw new Error(`Tool ${name} is already registered`);
    }

    this.tools.set(name, toolInstance);
    this.log('info', `Tool registered: ${name}`);
  }

  /**
   * Get a tool by name
   * 
   * @param {string} name - Tool name
   * @returns {Object} Tool instance
   * @throws {Error} If tool not found
   */
  get(name) {
    if (!this.tools.has(name)) {
      throw new Error(`Tool not found: ${name}. Available tools: ${this.list().join(', ')}`);
    }

    return this.tools.get(name);
  }

  /**
   * Check if tool exists
   * 
   * @param {string} name - Tool name
   * @returns {boolean} True if tool exists
   */
  has(name) {
    return this.tools.has(name);
  }

  /**
   * List all registered tools
   * 
   * @returns {string[]} Array of tool names
   */
  list() {
    return Array.from(this.tools.keys());
  }

  /**
   * Get count of registered tools
   * 
   * @returns {number} Number of registered tools
   */
  count() {
    return this.tools.size;
  }

  /**
   * Clear all registered tools (for testing)
   */
  clear() {
    this.tools.clear();
    this.log('warn', 'All tools cleared from registry');
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
      service: 'ToolRegistry',
      message,
      ...metadata
    };

    const logMethod = level === 'error' ? console.error : console.log;
    logMethod(JSON.stringify(logEntry));
  }
}

// Export singleton
module.exports = new ToolRegistry();
