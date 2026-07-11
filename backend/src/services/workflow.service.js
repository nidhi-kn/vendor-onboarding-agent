/**
 * workflow.service.js
 * 
 * Service layer for workflow operations.
 * Orchestrates WorkflowRuntime and Repository calls.
 * No business logic - only orchestration.
 */

const workflowRuntime = require('../runtime/workflowRuntime');
const workflowRepository = require('../repositories/workflowRepository');
const vendorRepository = require('../repositories/vendorRepository');
const documentRepository = require('../repositories/documentRepository');
const messageRepository = require('../repositories/messageRepository');
const approvalRepository = require('../repositories/approvalRepository');
const auditLogRepository = require('../repositories/auditLogRepository');
const agentRunRepository = require('../repositories/agentRunRepository');

class WorkflowService {
  /**
   * Process workflow event through runtime
   * 
   * @param {Object} params - Process parameters
   * @returns {Promise<Object>} Runtime result
   */
  async processWorkflow(params) {
    const { workflowId, trigger, incomingMessage } = params;

    if (!workflowId) {
      throw new Error('workflowId is required');
    }

    // Invoke workflow runtime
    const result = await workflowRuntime.execute({
      workflowId,
      trigger: trigger || 'user_message',
      incomingMessage: incomingMessage || {}
    });

    return result;
  }

  /**
   * Process incoming message from connector
   * 
   * @param {Object} message - Normalized connector message
   * @returns {Promise<Object>} Processing result
   */
  async processIncomingMessage(message) {
    const {
      workflowId,
      text,
      senderId,
      senderName,
      attachments
    } = message;

    // Build incoming message structure
    const incomingMessage = {
      messageType: attachments && attachments.length > 0 ? 'document' : 'text',
      content: text || '',
      senderName: senderName || senderId,
      senderId,
      documentUrl: attachments && attachments.length > 0 ? attachments[0].url : null
    };

    // Process through runtime
    const runtimeResult = await this.processWorkflow({
      workflowId,
      trigger: 'connector_message',
      incomingMessage
    });

    // Transform runtime result to expected connector format
    return this.transformRuntimeResult(runtimeResult);
  }

  /**
   * Transform workflow runtime result to connector-expected format
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
   * Get complete workflow details
   * 
   * @param {string} workflowId - Workflow ID
   * @returns {Promise<Object>} Complete workflow details
   */
  async getWorkflowDetails(workflowId) {
    // Get workflow with relations
    const workflow = await workflowRepository.findById(workflowId);

    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    // Get vendor if linked
    let vendor = null;
    if (workflow.vendorId) {
      vendor = await vendorRepository.findById(workflow.vendorId);
    }

    // Get documents
    const documents = await documentRepository.listByWorkflowId(workflowId);

    // Get recent messages
    const messages = await messageRepository.listByWorkflowId(workflowId, {
      take: 10,
      orderBy: { createdAt: 'desc' }
    });

    // Get approval status
    const approval = await approvalRepository.findByWorkflowId(workflowId);

    // Get recent timeline
    const timeline = await auditLogRepository.listByWorkflowId(workflowId, {
      take: 20,
      orderBy: { timestamp: 'desc' }
    });

    return {
      workflow: {
        id: workflow.id,
        currentState: workflow.currentState,
        previousState: workflow.previousState,
        stateHistory: workflow.stateHistory,
        channel: workflow.channel,
        createdAt: workflow.createdAt,
        updatedAt: workflow.updatedAt
      },
      vendor,
      documents,
      conversationSummary: {
        messageCount: messages.length,
        recentMessages: messages.slice(0, 5)
      },
      approval: approval ? {
        status: approval.status,
        requestedAt: approval.requestedAt,
        approvedBy: approval.approvedBy,
        rejectedBy: approval.rejectedBy,
        reason: approval.reason
      } : null,
      timeline: timeline.slice(0, 10)
    };
  }

  /**
   * Get workflow timeline
   * 
   * @param {string} workflowId - Workflow ID
   * @returns {Promise<Object>} Timeline with audit logs and agent runs
   */
  async getTimeline(workflowId) {
    // Get audit logs
    const auditLogs = await auditLogRepository.getAuditTrail(workflowId);

    // Get agent runs
    const agentRuns = await agentRunRepository.listByWorkflowId(workflowId);

    // Combine and sort by timestamp
    const timeline = [
      ...auditLogs.map(log => ({
        type: 'audit_log',
        timestamp: log.timestamp,
        actor: log.actor,
        action: log.action,
        fromState: log.fromState,
        toState: log.toState,
        description: log.description
      })),
      ...agentRuns.map(run => ({
        type: 'agent_run',
        timestamp: run.createdAt,
        status: run.status,
        reasoning: run.reasoning,
        latencyMs: run.latencyMs,
        toolCallsCount: run.toolCallsCount
      }))
    ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return {
      workflowId,
      totalEvents: timeline.length,
      timeline
    };
  }
}

// Export singleton
module.exports = new WorkflowService();
