/**
 * documentRepository.js
 * 
 * Database operations for Document model.
 * No business logic - only data access.
 */

const { prisma } = require('../config/db');

/**
 * Create new document
 * 
 * @param {Object} data - Document data
 * @returns {Promise<Object>} Created document
 */
async function create(data) {
  return await prisma.document.create({
    data: {
      id: data.documentId || undefined,
      workflowId: data.workflowId,
      documentType: data.documentType,
      fileName: data.fileName || null,
      fileUrl: data.fileUrl || null,
      status: data.status || 'pending',
      metadata: data.metadata ? JSON.stringify(data.metadata) : null
    }
  });
}

/**
 * Find document by ID
 * 
 * @param {string} id - Document ID
 * @returns {Promise<Object|null>} Document or null
 */
async function findById(id) {
  const document = await prisma.document.findUnique({
    where: { id }
  });

  if (document && document.metadata) {
    document.metadata = JSON.parse(document.metadata);
  }

  return document;
}

/**
 * List documents for workflow
 * 
 * @param {string} workflowId - Workflow ID
 * @param {Object} options - Query options
 * @returns {Promise<Array>} List of documents
 */
async function listByWorkflowId(workflowId, options = {}) {
  const { skip, take, orderBy, where } = options;
  
  const documents = await prisma.document.findMany({
    where: {
      workflowId,
      ...where
    },
    skip,
    take,
    orderBy: orderBy || { uploadedAt: 'desc' }
  });

  // Parse JSON metadata
  return documents.map(d => ({
    ...d,
    metadata: d.metadata ? JSON.parse(d.metadata) : null
  }));
}

/**
 * Update document
 * 
 * @param {string} id - Document ID
 * @param {Object} data - Update data
 * @returns {Promise<Object>} Updated document
 */
async function update(id, data) {
  return await prisma.document.update({
    where: { id },
    data: {
      status: data.status,
      fileName: data.fileName,
      fileUrl: data.fileUrl,
      verifiedAt: data.verifiedAt,
      metadata: data.metadata ? JSON.stringify(data.metadata) : undefined
    }
  });
}

/**
 * Find document by workflow and type
 * 
 * @param {string} workflowId - Workflow ID
 * @param {string} documentType - Document type
 * @returns {Promise<Object|null>} Document or null
 */
async function findByType(workflowId, documentType) {
  const document = await prisma.document.findFirst({
    where: {
      workflowId,
      documentType
    },
    orderBy: { uploadedAt: 'desc' }
  });

  if (document && document.metadata) {
    document.metadata = JSON.parse(document.metadata);
  }

  return document;
}

/**
 * Delete document
 * 
 * @param {string} id - Document ID
 * @returns {Promise<Object>} Deleted document
 */
async function deleteById(id) {
  return await prisma.document.delete({
    where: { id }
  });
}

/**
 * Delete all documents for workflow
 * 
 * @param {string} workflowId - Workflow ID
 * @returns {Promise<Object>} Delete count
 */
async function deleteByWorkflowId(workflowId) {
  return await prisma.document.deleteMany({
    where: { workflowId }
  });
}

module.exports = {
  create,
  findById,
  listByWorkflowId,
  update,
  findByType,
  deleteById,
  deleteByWorkflowId
};
