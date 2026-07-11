/**
 * timeline.controller.js
 * 
 * HTTP controller for timeline endpoints.
 */

const workflowService = require('../services/workflow.service');

class TimelineController {
  /**
   * GET /api/timeline/:workflowId
   * Get workflow timeline
   */
  async getTimeline(req, res, next) {
    try {
      const { workflowId } = req.params;

      // Get timeline
      const timeline = await workflowService.getTimeline(workflowId);

      // Return success
      res.status(200).json({
        success: true,
        data: timeline,
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
module.exports = new TimelineController();
