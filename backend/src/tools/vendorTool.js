/**
 * vendorTool.js
 * 
 * Manages vendor data operations.
 * Currently uses in-memory storage (mocked).
 * Phase 4 will replace with repository + database.
 */

class VendorTool {
  constructor() {
    // In-memory storage (mock)
    this.vendors = new Map();
  }

  /**
   * Execute vendor action
   * 
   * @param {string} action - Action to execute
   * @param {Object} args - Action arguments
   * @returns {Promise<Object>} Action result
   */
  async execute(action, args) {
    switch (action) {
      case 'create':
        return await this.createVendor(args);
      
      case 'get':
        return await this.getVendor(args);
      
      case 'update':
        return await this.updateVendor(args);
      
      default:
        throw new Error(`Unknown vendor action: ${action}`);
    }
  }

  /**
   * Create new vendor
   */
  async createVendor(args) {
    const { vendorId, vendorData } = args;

    if (!vendorId) {
      throw new Error('vendorId is required');
    }

    if (this.vendors.has(vendorId)) {
      throw new Error(`Vendor ${vendorId} already exists`);
    }

    const vendor = {
      vendorId,
      ...vendorData,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.vendors.set(vendorId, vendor);

    return {
      success: true,
      data: vendor
    };
  }

  /**
   * Get vendor by ID
   */
  async getVendor(args) {
    const { vendorId } = args;

    if (!vendorId) {
      throw new Error('vendorId is required');
    }

    const vendor = this.vendors.get(vendorId);

    if (!vendor) {
      return {
        success: false,
        error: `Vendor ${vendorId} not found`
      };
    }

    return {
      success: true,
      data: vendor
    };
  }

  /**
   * Update vendor information
   */
  async updateVendor(args) {
    const { vendorId, vendorData } = args;

    if (!vendorId) {
      throw new Error('vendorId is required');
    }

    let vendor = this.vendors.get(vendorId);

    if (!vendor) {
      // Create if doesn't exist
      vendor = {
        vendorId,
        createdAt: new Date()
      };
    }

    // Update fields
    vendor = {
      ...vendor,
      ...vendorData,
      updatedAt: new Date()
    };

    this.vendors.set(vendorId, vendor);

    return {
      success: true,
      data: vendor
    };
  }
}

// Export singleton
module.exports = new VendorTool();
