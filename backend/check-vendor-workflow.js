const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkVendorWorkflows() {
  try {
    const vendors = await prisma.vendor.findMany({
      include: {
        workflows: {
          take: 1,
          orderBy: { createdAt: 'desc' }
        }
      }
    });
    
    console.log('Vendors and their workflows:\n');
    vendors.forEach(vendor => {
      console.log(`Vendor ID: ${vendor.id}`);
      console.log(`Company: ${vendor.companyName}`);
      console.log(`Workflows: ${vendor.workflows.length}`);
      if (vendor.workflows.length > 0) {
        console.log(`First Workflow ID: ${vendor.workflows[0].id}`);
      }
      console.log('---');
    });
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkVendorWorkflows();
