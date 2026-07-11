/**
 * approval.routes.js
 * 
 * Routes for approval operations.
 */

const express = require('express');
const approvalController = require('../controllers/approval.controller');

const router = express.Router();

/**
 * GET /api/approvals
 * List all approvals
 */
router.get('/', (req, res, next) => {
  approvalController.listApprovals(req, res, next);
});

/**
 * POST /api/approval/:workflowId
 * Approve or reject workflow
 */
router.post('/:workflowId', (req, res, next) => {
  approvalController.processApproval(req, res, next);
});

module.exports = router;
