/**
 * approvalTool.js
 * 
 * Manages approval workflow operations.
 * Currently uses in-memory storage (mocked).
 * Phase 4 will replace with repository + database.
 */

class ApprovalTool {
  constructor() {
    // In-memory storage (mock)
    this.approvals = new Map();
  }

  /**
   * Execute approval action
   * 
   * @param {string} action - Action to execute
   * @param {Object} args - Action arguments
   * @returns {Promise<Object>} Action result
   */
  async execute(action, args) {
    switch (action) {
      case 'create_request':
        return await this.requestApproval(args);
      
      case 'approve':
        return await this.approve(args);
      
      case 'reject':
        return await this.reject(args);
      
      case 'get_status':
        return await this.getStatus(args);
      
      default:
        throw new Error(`Unknown approval action: ${action}`);
    }
  }

  /**
   * Create approval request
   */
  async requestApproval(args) {
    const { workflowId, vendorId, requestedBy } = args;

    if (!workflowId) {
      throw new Error('workflowId is required');
    }

    const approvalId = `appr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const approval = {
      approvalId,
      workflowId,
      vendorId: vendorId || null,
      status: 'pending',
      requestedBy: requestedBy || 'system',
      requestedAt: new Date(),
      approvedBy: null,
      approvedAt: null,
      rejectedBy: null,
      rejectedAt: null,
      reason: null
    };

    this.approvals.set(approvalId, approval);

    return {
      success: true,
      data: approval
    };
  }

  /**
   * Approve request
   */
  async approve(args) {
    const { approvalId, approvedBy, reason } = args;

    if (!approvalId) {
      throw new Error('approvalId is required');
    }

    const approval = this.approvals.get(approvalId);

    if (!approval) {
      return {
        success: false,
        error: 'Approval request not found'
      };
    }

    approval.status = 'approved';
    approval.approvedBy = approvedBy || 'admin';
    approval.approvedAt = new Date();
    approval.reason = reason || null;

    this.approvals.set(approvalId, approval);

    return {
      success: true,
      data: approval
    };
  }

  /**
   * Reject request
   */
  async reject(args) {
    const { approvalId, rejectedBy, reason } = args;

    if (!approvalId) {
      throw new Error('approvalId is required');
    }

    const approval = this.approvals.get(approvalId);

    if (!approval) {
      return {
        success: false,
        error: 'Approval request not found'
      };
    }

    approval.status = 'rejected';
    approval.rejectedBy = rejectedBy || 'admin';
    approval.rejectedAt = new Date();
    approval.reason = reason || 'Not specified';

    this.approvals.set(approvalId, approval);

    return {
      success: true,
      data: approval
    };
  }

  /**
   * Get approval status
   */
  async getStatus(args) {
    const { approvalId, workflowId } = args;

    if (approvalId) {
      const approval = this.approvals.get(approvalId);
      
      return {
        success: true,
        data: approval || null
      };
    }

    if (workflowId) {
      // Find by workflow
      const approval = Array.from(this.approvals.values())
        .find(a => a.workflowId === workflowId);
      
      return {
        success: true,
        data: approval || null
      };
    }

    throw new Error('Either approvalId or workflowId is required');
  }
}

// Export singleton
module.exports = new ApprovalTool();
