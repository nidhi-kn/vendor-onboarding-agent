/**
 * vendor.routes.js
 * 
 * Routes for vendor operations.
 */

const express = require('express');
const vendorController = require('../controllers/vendor.controller');

const router = express.Router();

/**
 * GET /api/vendors
 * List all vendors
 */
router.get('/', (req, res, next) => {
  vendorController.listVendors(req, res, next);
});

/**
 * GET /api/vendor/:id
 * Get vendor details
 */
router.get('/:id', (req, res, next) => {
  vendorController.getVendor(req, res, next);
});

module.exports = router;
