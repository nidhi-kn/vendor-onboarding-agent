/**
 * workflow.routes.js
 * 
 * Routes for workflow operations.
 */

const express = require('express');
const workflowController = require('../controllers/workflow.controller');

const router = express.Router();

/**
 * POST /api/workflow/process
 * Process workflow event
 */
router.post('/process', (req, res, next) => {
  workflowController.processWorkflow(req, res, next);
});

/**
 * GET /api/workflow/:id
 * Get workflow details
 */
router.get('/:id', (req, res, next) => {
  workflowController.getWorkflow(req, res, next);
});

module.exports = router;
