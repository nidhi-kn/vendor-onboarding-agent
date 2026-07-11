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
    const { vendorId } = args;

    if (!vendorId) {
      throw new Error('vendorId is required');
    }

    // Accept EITHER shape: nested vendorData object OR flat fields directly on args
    const vendorData = args.vendorData || {
      companyName: args.companyName,
      contactPerson: args.contactPerson,
      email: args.email,
      phone: args.phone,
      gstNumber: args.gstNumber,
      panNumber: args.panNumber,
      bankAccount: args.bankAccount
    };

    // Check if vendorData ends up with all fields undefined (neither shape matched)
    const hasAnyData = Object.values(vendorData).some(value => value !== undefined);
    if (!hasAnyData) {
      console.warn({
        timestamp: new Date().toISOString(),
        level: 'warn',
        service: 'VendorTool',
        message: 'updateVendor called with no usable vendor data',
        vendorId,
        args
      });
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
