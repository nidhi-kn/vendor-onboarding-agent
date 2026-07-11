/**
 * documentTool.js
 * 
 * Manages document operations.
 * Uses Prisma for persistent storage.
 */

const { DOCUMENT_TYPES } = require('../agent/constants');
const documentRepository = require('../repositories/documentRepository');

class DocumentTool {
  constructor() {
    // No in-memory storage - using database via repository
  }

  /**
   * Execute document action
   * 
   * @param {string} action - Action to execute
   * @param {Object} args - Action arguments
   * @returns {Promise<Object>} Action result
   */
  async execute(action, args) {
    switch (action) {
      case 'save':
        return await this.saveDocument(args);
      
      case 'list':
        return await this.listDocuments(args);
      
      case 'validate':
        return await this.verifyDocument(args);
      
      case 'get_missing':
        return await this.missingDocuments(args);
      
      default:
        throw new Error(`Unknown document action: ${action}`);
    }
  }

  /**
   * Save document
   */
  async saveDocument(args) {
    const { workflowId, documentType, fileUrl, fileName } = args;

    if (!workflowId || !documentType) {
      throw new Error('workflowId and documentType are required');
    }

    const document = await documentRepository.create({
      workflowId,
      documentType,
      fileName: fileName || 'unknown',
      fileUrl: fileUrl || null,
      status: 'pending'
    });

    return {
      success: true,
      data: document
    };
  }

  /**
   * List documents for workflow
   */
  async listDocuments(args) {
    const { workflowId } = args;

    if (!workflowId) {
      throw new Error('workflowId is required');
    }

    const documents = await documentRepository.listByWorkflowId(workflowId);

    return {
      success: true,
      data: documents
    };
  }

  /**
   * Verify/validate document
   */
  async verifyDocument(args) {
    const { documentId, workflowId, status } = args;

    if (!workflowId || !documentId) {
      throw new Error('workflowId and documentId are required');
    }

    const document = await documentRepository.update(documentId, {
      status: status || 'verified',
      verifiedAt: new Date()
    });

    return {
      success: true,
      data: document
    };
  }

  /**
   * Get missing documents
   */
  async missingDocuments(args) {
    const { workflowId } = args;

    if (!workflowId) {
      throw new Error('workflowId is required');
    }

    const documents = await documentRepository.listByWorkflowId(workflowId);
    const uploadedTypes = documents.map(d => d.documentType);

    const requiredTypes = [
      DOCUMENT_TYPES.GST_CERTIFICATE,
      DOCUMENT_TYPES.PAN_CARD,
      DOCUMENT_TYPES.BANK_PROOF
    ];

    const missing = requiredTypes.filter(type => !uploadedTypes.includes(type));

    return {
      success: true,
      data: {
        missing,
        uploaded: uploadedTypes,
        required: requiredTypes
      }
    };
  }
}

// Export singleton
module.exports = new DocumentTool();
