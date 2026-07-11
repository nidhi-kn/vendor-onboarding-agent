/**
 * connector.controller.js
 * 
 * HTTP controller for connector endpoints.
 * Future Telegram, WhatsApp, Email connectors will use this.
 */

const connectorService = require('../services/connector.service');

class ConnectorController {
  /**
   * POST /api/connector/message
   * Receive normalized message from connector
   */
  async receiveMessage(req, res, next) {
    try {
      const {
        connectorId,
        workflowId,
        channelId,
        senderId,
        senderName,
        text,
        attachments
      } = req.body;

      // Validate
      if (!workflowId) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'workflowId is required'
          }
        });
      }

      if (!senderId) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'senderId is required'
          }
        });
      }

      // Process
      const result = await connectorService.processMessage({
        connectorId,
        workflowId,
        channelId,
        senderId,
        senderName,
        text,
        attachments
      });

      // Return success
      res.status(200).json({
        success: true,
        data: result,
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
module.exports = new ConnectorController();
