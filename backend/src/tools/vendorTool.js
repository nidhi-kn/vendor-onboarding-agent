/**
 * vendorTool.js
 * 
 * Manages vendor data operations.
 * Uses Prisma for persistent storage.
 */

const vendorRepository = require('../repositories/vendorRepository');

class VendorTool {
  constructor() {
    // No in-memory storage - using database via repository
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

    // Check if vendor exists
    const existing = await vendorRepository.findById(vendorId);
    if (existing) {
      throw new Error(`Vendor ${vendorId} already exists`);
    }

    const vendor = await vendorRepository.create({
      vendorId,
      ...vendorData
    });

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

    const vendor = await vendorRepository.findById(vendorId);

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

    // Upsert - create if doesn't exist, update if exists
    const vendor = await vendorRepository.upsert(vendorId, vendorData);

    return {
      success: true,
      data: vendor
    };
  }
}

// Export singleton
module.exports = new VendorTool();
