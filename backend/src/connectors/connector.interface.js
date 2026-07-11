/**
 * connector.interface.js
 * 
 * Abstract connector interface that all connectors must implement.
 * Defines the contract for external system integration.
 * 
 * Connectors are transport adapters - they NEVER:
 * - Import WorkflowRuntime
 * - Import Planner
 * - Import Tools
 * - Import Repositories
 * 
 * Connectors communicate ONLY through HTTP to /api/connector/message
 */

class Connector {
  constructor(config = {}) {
    this.connectorId = config.connectorId || 'unknown';
    this.config = config;
    this.connected = false;
    this.metrics = {
      messagesReceived: 0,
      messagesSent: 0,
      failedMessages: 0,
      uptime: Date.now(),
      lastHeartbeat: null
    };
  }

  /**
   * Connect to external system
   * @abstract
   * @returns {Promise<void>}
   */
  async connect() {
    throw new Error('connect() must be implemented by connector');
  }

  /**
   * Disconnect from external system
   * @abstract
   * @returns {Promise<void>}
   */
  async disconnect() {
    throw new Error('disconnect() must be implemented by connector');
  }

  /**
   * Send message to external system
   * @abstract
   * @param {string} channelId - Channel/chat ID
   * @param {string} message - Message text
   * @returns {Promise<Object>}
   */
  async sendMessage(channelId, message) {
    throw new Error('sendMessage() must be implemented by connector');
  }

  /**
   * Send file to external system
   * @abstract
   * @param {string} channelId - Channel/chat ID
   * @param {string} fileUrl - File URL
   * @param {string} caption - File caption
   * @returns {Promise<Object>}
   */
  async sendFile(channelId, fileUrl, caption) {
    throw new Error('sendFile() must be implemented by connector');
  }

  /**
   * Normalize inbound message to standard format
   * @abstract
   * @param {Object} externalMessage - External system message
   * @returns {Object} Normalized message
   */
  normalizeInbound(externalMessage) {
    throw new Error('normalizeInbound() must be implemented by connector');
  }

  /**
   * Health check for connector
   * @abstract
   * @returns {Promise<Object>}
   */
  async healthCheck() {
    throw new Error('healthCheck() must be implemented by connector');
  }

  /**
   * Get connector metrics
   * @returns {Object} Metrics object
   */
  getMetrics() {
    return {
      connectorId: this.connectorId,
      connected: this.connected,
      ...this.metrics,
      uptimeSeconds: Math.floor((Date.now() - this.metrics.uptime) / 1000)
    };
  }

  /**
   * Update last heartbeat
   */
  heartbeat() {
    this.metrics.lastHeartbeat = new Date().toISOString();
  }

  /**
   * Increment message received counter
   */
  incrementReceived() {
    this.metrics.messagesReceived++;
  }

  /**
   * Increment message sent counter
   */
  incrementSent() {
    this.metrics.messagesSent++;
  }

  /**
   * Increment failed message counter
   */
  incrementFailed() {
    this.metrics.failedMessages++;
  }
}

module.exports = Connector;
