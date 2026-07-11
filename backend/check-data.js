const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkData() {
  try {
    const vendorCount = await prisma.vendor.count();
    const workflowCount = await prisma.workflow.count();
    const approvalCount = await prisma.approval.count();
    
    console.log('Database Status:');
    console.log('- Vendors:', vendorCount);
    console.log('- Workflows:', workflowCount);
    console.log('- Approvals:', approvalCount);
    
    if (vendorCount === 0) {
      console.log('\nWARNING: No vendors in database!');
      console.log('Run: node test-integration.js to create test data');
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();
