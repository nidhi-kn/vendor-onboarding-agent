/**
 * workflow.controller.js
 * 
 * HTTP controllers for workflow endpoints.
 * Validates requests, calls services, returns JSON.
 * No business logic.
 */

const workflowService = require('../services/workflow.service');

class WorkflowController {
  /**
   * POST /api/workflow/process
   * Process workflow event
   */
  async processWorkflow(req, res, next) {
    try {
      const { workflowId, trigger, incomingMessage } = req.body;

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

      // Process
      const result = await workflowService.processWorkflow({
        workflowId,
        trigger,
        incomingMessage
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

  /**
   * GET /api/workflow/:id
   * Get workflow details
   */
  async getWorkflow(req, res, next) {
    try {
      const { id } = req.params;

      // Get details
      const details = await workflowService.getWorkflowDetails(id);

      // Return success
      res.status(200).json({
        success: true,
        data: details,
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
module.exports = new WorkflowController();
