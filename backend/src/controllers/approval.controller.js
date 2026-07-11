/**
 * approval.controller.js
 * 
 * HTTP controller for approval endpoints.
 */

const approvalRepository = require('../repositories/approvalRepository');
const approvalTool = require('../tools/approvalTool');

class ApprovalController {
  /**
   * POST /api/approval/:workflowId
   * Approve or reject workflow
   */
  async processApproval(req, res, next) {
    try {
      const { workflowId } = req.params;
      const { action, reason, approvedBy, rejectedBy } = req.body;

      // Validate
      if (!action || !['approve', 'reject'].includes(action)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'action must be "approve" or "reject"'
          }
        });
      }

      // Find approval request
      const approval = await approvalRepository.findByWorkflowId(workflowId);

      if (!approval) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `No approval request found for workflow ${workflowId}`
          }
        });
      }

      // Process approval/rejection
      let result;
      if (action === 'approve') {
        result = await approvalTool.execute('approve', {
          approvalId: approval.id,
          approvedBy: approvedBy || 'admin',
          reason
        });
      } else {
        result = await approvalTool.execute('reject', {
          approvalId: approval.id,
          rejectedBy: rejectedBy || 'admin',
          reason
        });
      }

      // Return success
      res.status(200).json({
        success: true,
        data: result.data,
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
module.exports = new ApprovalController();
