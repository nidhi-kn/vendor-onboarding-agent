/**
 * mockErpConnector.js
 * 
 * Mock ERP connector for testing.
 * Simulates ERP operations without real HTTP calls.
 * 
 * Demonstrates how future ERP integration would work:
 * - Create vendor
 * - Sync vendor
 * - Get vendor status
 */

const Connector = require('./connector.interface');
const connectorMetrics = require('./connectorMetrics');

class MockErpConnector extends Connector {
  constructor(config = {}) {
    super({
      connectorId: 'mock-erp',
      ...config
    });

    // Mock ERP data store
    this.vendors = new Map();
    this.syncLog = [];

    // Mock ERP configuration
    this.erpConfig = {
      erpUrl: 'https://mock-erp.example.com',
      apiKey: 'mock-api-key',
      companyId: 'COMP-001'
    };
  }

  /**
   * Connect to mock ERP
   */
  async connect() {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'info',
      service: 'MockErpConnector',
      message: 'Connecting to mock ERP',
      erpUrl: this.erpConfig.erpUrl
    }));

    // Simulate connection delay
    await this.sleep(100);

    this.connected = true;
    connectorMetrics.updateStatus(this.connectorId, true);

    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'info',
      service: 'MockErpConnector',
      message: 'Connected to mock ERP successfully'
    }));
  }

  /**
   * Disconnect from mock ERP
   */
  async disconnect() {
    this.connected = false;
    connectorMetrics.updateStatus(this.connectorId, false);

    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'info',
      service: 'MockErpConnector',
      message: 'Disconnected from mock ERP'
    }));
  }

  /**
   * Create vendor in ERP
   * @param {Object} vendorData - Vendor data
   * @returns {Promise<Object>} Created vendor
   */
  async createVendor(vendorData) {
    this.incrementReceived();
    connectorMetrics.recordReceived(this.connectorId);

    const vendorId = `ERP-V-${Date.now()}`;
    const vendor = {
      erpVendorId: vendorId,
      companyName: vendorData.companyName,
      contactPerson: vendorData.contactPerson,
      email: vendorData.email,
      phone: vendorData.phone,
      gstNumber: vendorData.gstNumber,
      panNumber: vendorData.panNumber,
      status: 'active',
      createdAt: new Date().toISOString(),
      syncedAt: new Date().toISOString()
    };

    this.vendors.set(vendorId, vendor);
    this.logSync('create_vendor', vendorId, vendor);

    this.incrementSent();
    connectorMetrics.recordSent(this.connectorId);

    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'info',
      service: 'MockErpConnector',
      message: 'Vendor created in mock ERP',
      vendorId
    }));

    return vendor;
  }

  /**
   * Sync vendor to ERP
   * @param {string} vendorId - Vendor ID
   * @param {Object} vendorData - Vendor data
   * @returns {Promise<Object>} Sync result
   */
  async syncVendor(vendorId, vendorData) {
    this.incrementReceived();
    connectorMetrics.recordReceived(this.connectorId);

    let vendor = this.vendors.get(vendorId);

    if (!vendor) {
      // Create if doesn't exist
      return await this.createVendor(vendorData);
    }

    // Update existing vendor
    vendor = {
      ...vendor,
      ...vendorData,
      syncedAt: new Date().toISOString()
    };

    this.vendors.set(vendorId, vendor);
    this.logSync('sync_vendor', vendorId, vendor);

    this.incrementSent();
    connectorMetrics.recordSent(this.connectorId);

    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'info',
      service: 'MockErpConnector',
      message: 'Vendor synced to mock ERP',
      vendorId
    }));

    return {
      success: true,
      vendorId,
      syncedAt: vendor.syncedAt
    };
  }

  /**
   * Get vendor status from ERP
   * @param {string} vendorId - Vendor ID
   * @returns {Promise<Object>} Vendor status
   */
  async getVendorStatus(vendorId) {
    this.incrementReceived();
    connectorMetrics.recordReceived(this.connectorId);

    const vendor = this.vendors.get(vendorId);

    if (!vendor) {
      this.incrementFailed();
      connectorMetrics.recordFailed(this.connectorId);

      return {
        success: false,
        error: `Vendor ${vendorId} not found in ERP`
      };
    }

    this.incrementSent();
    connectorMetrics.recordSent(this.connectorId);

    return {
      success: true,
      vendor
    };
  }

  /**
   * Get sync log
   * @returns {Array} Sync log entries
   */
  getSyncLog() {
    return this.syncLog;
  }

  /**
   * Log sync operation
   * @private
   */
  logSync(operation, vendorId, data) {
    this.syncLog.push({
      operation,
      vendorId,
      data,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Send message (not applicable for ERP)
   */
  async sendMessage(channelId, message) {
    throw new Error('sendMessage() not applicable for ERP connector');
  }

  /**
   * Send file (not applicable for ERP)
   */
  async sendFile(channelId, fileUrl, caption) {
    throw new Error('sendFile() not applicable for ERP connector');
  }

  /**
   * Normalize inbound (not applicable for ERP)
   */
  normalizeInbound(externalMessage) {
    throw new Error('normalizeInbound() not applicable for ERP connector');
  }

  /**
   * Health check
   */
  async healthCheck() {
    return {
      healthy: true,
      message: 'Mock ERP is always healthy',
      connected: this.connected,
      vendorCount: this.vendors.size,
      syncLogEntries: this.syncLog.length
    };
  }

  /**
   * Sleep utility
   * @private
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = MockErpConnector;
