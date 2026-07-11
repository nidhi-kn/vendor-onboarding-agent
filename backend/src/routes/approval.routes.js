/**
 * approval.routes.js
 * 
 * Routes for approval operations.
 */

const express = require('express');
const approvalController = require('../controllers/approval.controller');

const router = express.Router();

/**
 * POST /api/approval/:workflowId
 * Approve or reject workflow
 */
router.post('/:workflowId', (req, res, next) => {
  approvalController.processApproval(req, res, next);
});

module.exports = router;
