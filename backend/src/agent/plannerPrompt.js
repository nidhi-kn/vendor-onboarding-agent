/**
 * plannerPrompt.js
 * 
 * Loads system prompt for the Planner Agent from versioned prompt file.
 * 
 * Prompt versioning allows:
 * - Version control and tracking
 * - Easy prompt iteration and A/B testing
 * - Rollback to previous versions
 * - Separation of prompt content from code
 */

const fs = require('fs');
const path = require('path');

/**
 * Load system prompt from versioned prompt file
 * 
 * @param {string} version - Prompt version (default: 'v1')
 * @returns {string} System prompt content
 */
function loadSystemPrompt(version = 'v1') {
  const promptPath = path.join(__dirname, '../../prompts/planner', `${version}.md`);
  
  try {
    const prompt = fs.readFileSync(promptPath, 'utf-8');
    return prompt;
  } catch (error) {
    throw new Error(
      `Failed to load planner prompt ${version}: ${error.message}. ` +
      `Expected file at: ${promptPath}`
    );
  }
}

/**
 * System prompt for the Planner Agent
 * Loaded from versioned file: prompts/planner/v1.md
 */
const PLANNER_SYSTEM_PROMPT = loadSystemPrompt('v1');

/**
 * Generate user prompt from context
 * 
 * @param {Object} context - Planning context
 * @returns {string} Formatted user prompt
 */
function generateUserPrompt(context) {
  const {
    vendorContext,
    workflowContext,
    documents,
    conversationHistory,
    incomingMessage
  } = context;

  // Use placeholder for empty content when document is present
  const contentForPrompt = incomingMessage.content && incomingMessage.content.trim().length > 0
    ? incomingMessage.content
    : (incomingMessage.documentUrl ? '[Vendor uploaded a document with no caption text]' : '');

  return `# CURRENT CONTEXT

## Workflow State
Current State: ${workflowContext.currentState}
Previous State: ${workflowContext.previousState || 'None'}
Workflow ID: ${workflowContext.workflowId}

## Vendor Information
Vendor ID: ${vendorContext.vendorId || 'Not assigned'}
Company Name: ${vendorContext.companyName || 'Not provided'}
Contact Person: ${vendorContext.contactPerson || 'Not provided'}
Email: ${vendorContext.email || 'Not provided'}
Phone: ${vendorContext.phone || 'Not provided'}
GST Number: ${vendorContext.gstNumber || 'Not provided'}
PAN Number: ${vendorContext.panNumber || 'Not provided'}

## Uploaded Documents
${documents.length > 0 
  ? documents.map(doc => `- ${doc.documentType}: ${doc.status}`).join('\n')
  : 'No documents uploaded yet'}

## Recent Conversation (last 5 messages)
${conversationHistory.slice(-5).map(msg => 
  `[${msg.sender}]: ${msg.content}`
).join('\n')}

## Incoming Message
Type: ${incomingMessage.messageType}
From: ${incomingMessage.senderName}
Content: ${contentForPrompt}
${incomingMessage.documentUrl ? `Document: ${incomingMessage.documentUrl}` : ''}

# YOUR TASK
Analyze the above context and decide:
1. What does the vendor need right now?
2. What should happen next?
3. Which tools should be called?
4. What state should we move to (if any)?
5. What message should we send to the vendor?

Respond with valid JSON following the specified format.`;
}

module.exports = {
  PLANNER_SYSTEM_PROMPT,
  generateUserPrompt
};
