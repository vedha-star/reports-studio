const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- STARTING DATABASE CLEANUP ---');
  
  // Delete categories with no creator
  const catRes = await prisma.category.deleteMany({
    where: {
      OR: [
        { createdBy: null },
        { createdBy: '' }
      ]
    }
  });
  console.log(`Deleted ${catRes.count} static categories.`);

  // Delete reports with no author
  const repRes = await prisma.report.deleteMany({
    where: {
      OR: [
        { authorId: null },
        { authorId: '' }
      ]
    }
  });
  console.log(`Deleted ${repRes.count} static reports.`);

  console.log('--- CLEANUP COMPLETE ---');
}

main()
  .catch(e => {
    console.error('Cleanup failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
