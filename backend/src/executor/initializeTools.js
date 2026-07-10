/**
 * initializeTools.js
 * 
 * Registers all business tools with the Tool Registry.
 * Must be called once at startup before executing any workflows.
 */

const toolRegistry = require('../registry/toolRegistry');

// Import all tools
const workflowTool = require('../tools/workflowTool');
const vendorTool = require('../tools/vendorTool');
const documentTool = require('../tools/documentTool');
const conversationTool = require('../tools/conversationTool');
const approvalTool = require('../tools/approvalTool');
const notificationTool = require('../tools/notificationTool');
const loggerTool = require('../tools/loggerTool');

/**
 * Initialize and register all tools
 */
function initializeTools() {
  // Register all business tools
  toolRegistry.register('workflow', workflowTool);
  toolRegistry.register('vendor', vendorTool);
  toolRegistry.register('document', documentTool);
  toolRegistry.register('conversation', conversationTool);
  toolRegistry.register('approval', approvalTool);
  toolRegistry.register('notification', notificationTool);
  toolRegistry.register('logger', loggerTool);

  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    level: 'info',
    service: 'ToolInitializer',
    message: 'All tools registered',
    toolsCount: toolRegistry.count(),
    tools: toolRegistry.list()
  }));
}

module.exports = { initializeTools };
