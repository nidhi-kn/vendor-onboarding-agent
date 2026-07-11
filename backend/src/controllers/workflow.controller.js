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
      const runtimeResult = await workflowService.processWorkflow({
        workflowId,
        trigger,
        incomingMessage
      });

      // Transform to expected format (same as connector format for consistency)
      const result = this.transformRuntimeResult(runtimeResult);

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
   * Transform workflow runtime result to API format
   * @private
   * @param {Object} runtimeResult - Result from workflow runtime
   * @returns {Object} Transformed result
   */
  transformRuntimeResult(runtimeResult) {
    if (runtimeResult.status === 'error') {
      return {
        workflowState: null,
        responseMessage: 'I encountered an error processing your request. Please try again.',
        error: runtimeResult.metadata?.error?.message || 'Unknown error'
      };
    }

    // Extract response message from planner response
    let responseMessage = 'Thank you for your message.'; // Default
    
    if (runtimeResult.plannerResponse && runtimeResult.plannerResponse.responseMessage) {
      responseMessage = runtimeResult.plannerResponse.responseMessage;
    }

    return {
      workflowState: runtimeResult.nextState || runtimeResult.currentState,
      responseMessage: responseMessage,
      currentState: runtimeResult.currentState,
      nextState: runtimeResult.nextState,
      executionSuccess: runtimeResult.executionResult?.success || false
    };
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
