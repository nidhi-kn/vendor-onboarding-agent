/**
 * connector.routes.js
 * 
 * Routes for connector operations.
 * Future Telegram, WhatsApp, Email connectors plug in here.
 */

const express = require('express');
const connectorController = require('../controllers/connector.controller');

const router = express.Router();

/**
 * POST /api/connector/message
 * Receive normalized message from connector
 */
router.post('/message', (req, res, next) => {
  connectorController.receiveMessage(req, res, next);
});

module.exports = router;
