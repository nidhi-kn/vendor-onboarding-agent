/**
 * log.routes.js
 * 
 * Routes for audit log operations.
 */

const express = require('express');
const logController = require('../controllers/log.controller');

const router = express.Router();

/**
 * GET /api/logs
 * List audit logs
 */
router.get('/', (req, res, next) => {
  logController.listLogs(req, res, next);
});

/**
 * GET /api/logs/:workflowId
 * Get audit logs for specific workflow
 */
router.get('/:workflowId', (req, res, next) => {
  logController.getWorkflowLogs(req, res, next);
});

module.exports = router;
