const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkWorkflows() {
  try {
    const workflows = await prisma.workflow.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`Total workflows: ${workflows.length}\n`);
    workflows.forEach(wf => {
      console.log(`Workflow ID: ${wf.id}`);
      console.log(`Vendor ID: ${wf.vendorId || 'NULL'}`);
      console.log(`State: ${wf.currentState}`);
      console.log('---');
    });
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkWorkflows();
