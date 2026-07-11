/**
 * connectorRegistry.js
 * 
 * Registry for managing connector instances.
 * Prevents duplicate registrations.
 */

const connectorMetrics = require('./connectorMetrics');

class ConnectorRegistry {
  constructor() {
    this.connectors = new Map();
  }

  /**
   * Register a connector
   * @param {string} connectorId - Unique connector ID
   * @param {Connector} connector - Connector instance
   * @returns {boolean} True if registered, false if already exists
   */
  register(connectorId, connector) {
    if (this.connectors.has(connectorId)) {
      console.warn(JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'warn',
        service: 'ConnectorRegistry',
        message: `Connector ${connectorId} already registered`
      }));
      return false;
    }

    this.connectors.set(connectorId, connector);
    connectorMetrics.register(connectorId);

    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'info',
      service: 'ConnectorRegistry',
      message: `Connector ${connectorId} registered successfully`
    }));

    return true;
  }

  /**
   * Get a connector by ID
   * @param {string} connectorId - Connector ID
   * @returns {Connector|null} Connector instance or null
   */
  get(connectorId) {
    return this.connectors.get(connectorId) || null;
  }

  /**
   * List all registered connectors
   * @returns {Array} Array of connector IDs
   */
  list() {
    return Array.from(this.connectors.keys());
  }

  /**
   * Unregister a connector
   * @param {string} connectorId - Connector ID
   * @returns {boolean} True if unregistered
   */
  unregister(connectorId) {
    const existed = this.connectors.delete(connectorId);
    
    if (existed) {
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'info',
        service: 'ConnectorRegistry',
        message: `Connector ${connectorId} unregistered`
      }));
    }

    return existed;
  }

  /**
   * Check if connector exists
   * @param {string} connectorId - Connector ID
   * @returns {boolean}
   */
  has(connectorId) {
    return this.connectors.has(connectorId);
  }

  /**
   * Get all connectors
   * @returns {Map} Map of connectors
   */
  getAll() {
    return this.connectors;
  }

  /**
   * Get health status of all connectors
   * @returns {Promise<Array>} Array of health statuses
   */
  async getHealthStatus() {
    const statuses = [];

    for (const [connectorId, connector] of this.connectors) {
      try {
        const health = await connector.healthCheck();
        statuses.push({
          connectorId,
          healthy: health.healthy,
          ...health
        });
      } catch (error) {
        statuses.push({
          connectorId,
          healthy: false,
          error: error.message
        });
      }
    }

    return statuses;
  }
}

// Export singleton
module.exports = new ConnectorRegistry();
