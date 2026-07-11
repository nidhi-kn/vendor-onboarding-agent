/**
 * connectorMetrics.js
 * 
 * Centralized metrics collection for all connectors.
 */

class ConnectorMetrics {
  constructor() {
    this.metrics = new Map();
  }

  /**
   * Register a connector for metrics tracking
   * @param {string} connectorId - Connector ID
   */
  register(connectorId) {
    if (!this.metrics.has(connectorId)) {
      this.metrics.set(connectorId, {
        connectorId,
        messagesReceived: 0,
        messagesSent: 0,
        failedMessages: 0,
        uptime: Date.now(),
        lastHeartbeat: null,
        connected: false
      });
    }
  }

  /**
   * Update connector status
   * @param {string} connectorId - Connector ID
   * @param {boolean} connected - Connection status
   */
  updateStatus(connectorId, connected) {
    const metrics = this.metrics.get(connectorId);
    if (metrics) {
      metrics.connected = connected;
    }
  }

  /**
   * Record message received
   * @param {string} connectorId - Connector ID
   */
  recordReceived(connectorId) {
    const metrics = this.metrics.get(connectorId);
    if (metrics) {
      metrics.messagesReceived++;
    }
  }

  /**
   * Record message sent
   * @param {string} connectorId - Connector ID
   */
  recordSent(connectorId) {
    const metrics = this.metrics.get(connectorId);
    if (metrics) {
      metrics.messagesSent++;
    }
  }

  /**
   * Record failed message
   * @param {string} connectorId - Connector ID
   */
  recordFailed(connectorId) {
    const metrics = this.metrics.get(connectorId);
    if (metrics) {
      metrics.failedMessages++;
    }
  }

  /**
   * Update heartbeat
   * @param {string} connectorId - Connector ID
   */
  heartbeat(connectorId) {
    const metrics = this.metrics.get(connectorId);
    if (metrics) {
      metrics.lastHeartbeat = new Date().toISOString();
    }
  }

  /**
   * Get metrics for a connector
   * @param {string} connectorId - Connector ID
   * @returns {Object|null} Metrics object
   */
  getMetrics(connectorId) {
    const metrics = this.metrics.get(connectorId);
    if (!metrics) {
      return null;
    }

    return {
      ...metrics,
      uptimeSeconds: Math.floor((Date.now() - metrics.uptime) / 1000)
    };
  }

  /**
   * Get all connector metrics
   * @returns {Array} Array of metrics
   */
  getAllMetrics() {
    return Array.from(this.metrics.values()).map(m => ({
      ...m,
      uptimeSeconds: Math.floor((Date.now() - m.uptime) / 1000)
    }));
  }
}

// Export singleton
module.exports = new ConnectorMetrics();
