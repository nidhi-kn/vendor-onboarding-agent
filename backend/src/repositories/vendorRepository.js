/**
 * vendorRepository.js
 * 
 * Database operations for Vendor model.
 * No business logic - only data access.
 */

const { prisma } = require('../config/db');

/**
 * Create new vendor
 * 
 * @param {Object} data - Vendor data
 * @returns {Promise<Object>} Created vendor
 */
async function create(data) {
  return await prisma.vendor.create({
    data: {
      id: data.vendorId || undefined,
      companyName: data.companyName || null,
      contactPerson: data.contactPerson || null,
      email: data.email || null,
      phone: data.phone || null,
      gstNumber: data.gstNumber || null,
      panNumber: data.panNumber || null,
      bankAccount: data.bankAccount || null
    }
  });
}

/**
 * Find vendor by ID
 * 
 * @param {string} id - Vendor ID
 * @returns {Promise<Object|null>} Vendor or null
 */
async function findById(id) {
  return await prisma.vendor.findUnique({
    where: { id }
  });
}

/**
 * Update vendor
 * 
 * @param {string} id - Vendor ID
 * @param {Object} data - Update data
 * @returns {Promise<Object>} Updated vendor
 */
async function update(id, data) {
  return await prisma.vendor.update({
    where: { id },
    data: {
      companyName: data.companyName,
      contactPerson: data.contactPerson,
      email: data.email,
      phone: data.phone,
      gstNumber: data.gstNumber,
      panNumber: data.panNumber,
      bankAccount: data.bankAccount
    }
  });
}

/**
 * Upsert vendor (create or update)
 * 
 * @param {string} id - Vendor ID
 * @param {Object} data - Vendor data
 * @returns {Promise<Object>} Vendor
 */
async function upsert(id, data) {
  return await prisma.vendor.upsert({
    where: { id },
    update: {
      companyName: data.companyName,
      contactPerson: data.contactPerson,
      email: data.email,
      phone: data.phone,
      gstNumber: data.gstNumber,
      panNumber: data.panNumber,
      bankAccount: data.bankAccount
    },
    create: {
      id,
      companyName: data.companyName || null,
      contactPerson: data.contactPerson || null,
      email: data.email || null,
      phone: data.phone || null,
      gstNumber: data.gstNumber || null,
      panNumber: data.panNumber || null,
      bankAccount: data.bankAccount || null
    }
  });
}

/**
 * List all vendors
 * 
 * @param {Object} options - Query options
 * @returns {Promise<Array>} List of vendors
 */
async function list(options = {}) {
  const { skip, take, orderBy } = options;
  
  return await prisma.vendor.findMany({
    skip,
    take,
    orderBy: orderBy || { createdAt: 'desc' }
  });
}

/**
 * Delete vendor
 * 
 * @param {string} id - Vendor ID
 * @returns {Promise<Object>} Deleted vendor
 */
async function deleteById(id) {
  return await prisma.vendor.delete({
    where: { id }
  });
}

module.exports = {
  create,
  findById,
  update,
  upsert,
  list,
  deleteById
};
