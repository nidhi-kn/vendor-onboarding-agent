/**
 * log.controller.js
 * 
 * HTTP controller for audit log endpoints.
 */

const auditLogRepository = require('../repositories/auditLogRepository');

class LogController {
  /**
   * GET /api/logs
   * List audit logs (all or filtered by action)
   */
  async listLogs(req, res, next) {
    try {
      const { action, skip, take, workflowId } = req.query;

      // Parse pagination params
      const options = {
        skip: skip ? parseInt(skip) : undefined,
        take: take ? parseInt(take) : 50, // Default limit to 50
        orderBy: { timestamp: 'desc' }
      };

      let logs;
      if (action) {
        // Filter by action type
        logs = await auditLogRepository.listByAction(action, options);
      } else if (workflowId) {
        // Filter by workflow
        logs = await auditLogRepository.listByWorkflowId(workflowId, options);
      } else {
        // Get recent logs across all workflows
        // Since there's no "list all" method, we'll use a workaround
        const { prisma } = require('../config/db');
        const rawLogs = await prisma.auditLog.findMany({
          skip: options.skip,
          take: options.take,
          orderBy: options.orderBy,
          include: {
            workflow: {
              include: {
                vendor: true
              }
            }
          }
        });
        
        // Parse JSON metadata
        logs = rawLogs.map(l => ({
          ...l,
          metadata: l.metadata ? JSON.parse(l.metadata) : null
        }));
      }

      // Return success
      res.status(200).json({
        success: true,
        data: {
          logs,
          count: logs.length
        },
        metadata: {
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/logs/:workflowId
   * Get audit logs for specific workflow
   */
  async getWorkflowLogs(req, res, next) {
    try {
      const { workflowId } = req.params;
      const { skip, take } = req.query;

      // Parse pagination params
      const options = {
        skip: skip ? parseInt(skip) : undefined,
        take: take ? parseInt(take) : undefined
      };

      // Get logs for workflow
      const logs = await auditLogRepository.listByWorkflowId(workflowId, options);

      // Return success
      res.status(200).json({
        success: true,
        data: {
          workflowId,
          logs,
          count: logs.length
        },
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
module.exports = new LogController();
