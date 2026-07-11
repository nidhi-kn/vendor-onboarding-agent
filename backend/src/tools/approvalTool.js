/**
 * approvalTool.js
 * 
 * Manages approval workflow operations.
 * Uses Prisma for persistent storage.
 */

const approvalRepository = require('../repositories/approvalRepository');

class ApprovalTool {
  constructor() {
    // No in-memory storage - using database via repository
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

    const approval = await approvalRepository.create({
      workflowId,
      vendorId: vendorId || null,
      status: 'pending',
      requestedBy: requestedBy || 'system'
    });

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

    const approval = await approvalRepository.update(approvalId, {
      status: 'approved',
      approvedBy: approvedBy || 'admin',
      approvedAt: new Date(),
      reason: reason || null
    });

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

    const approval = await approvalRepository.update(approvalId, {
      status: 'rejected',
      rejectedBy: rejectedBy || 'admin',
      rejectedAt: new Date(),
      reason: reason || 'Not specified'
    });

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
      const approval = await approvalRepository.findById(approvalId);
      
      return {
        success: true,
        data: approval || null
      };
    }

    if (workflowId) {
      const approval = await approvalRepository.findByWorkflowId(workflowId);
      
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
