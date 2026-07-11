/**
 * timeline.routes.js
 * 
 * Routes for timeline operations.
 */

const express = require('express');
const timelineController = require('../controllers/timeline.controller');

const router = express.Router();

/**
 * GET /api/timeline/:workflowId
 * Get workflow timeline (audit logs + agent runs)
 */
router.get('/:workflowId', (req, res, next) => {
  timelineController.getTimeline(req, res, next);
});

module.exports = router;
