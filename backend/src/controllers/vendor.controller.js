/**
 * vendor.controller.js
 * 
 * HTTP controller for vendor endpoints.
 */

const vendorRepository = require('../repositories/vendorRepository');

class VendorController {
  /**
   * GET /api/vendor/:id
   * Get vendor details
   */
  async getVendor(req, res, next) {
    try {
      const { id } = req.params;

      // Get vendor
      const vendor = await vendorRepository.findById(id);

      if (!vendor) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Vendor ${id} not found`
          }
        });
      }

      // Return success
      res.status(200).json({
        success: true,
        data: vendor,
        metadata: {
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

// Export singleton
module.exports = new VendorController();
