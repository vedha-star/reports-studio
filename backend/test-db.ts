import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({
  connectionString:
    'postgresql://postgres:12345@localhost:5432/navacle_report_studio',
});
const prisma = new PrismaClient({ adapter });

async function testDB() {
  try {
    console.log('--- Database Connection Test ---');
    await prisma.$connect();
    console.log('✅ PostgreSQL connected successfully.');

    console.log('\n--- Checking Users ---');
    const users = await prisma.user.findMany();
    console.log(`Found ${users.length} users.`);
    users.forEach((u) =>
      console.log(`- ${u.name} (${u.email}) [Role: ${u.role}]`),
    );

    console.log('\n--- Checking Reports ---');
    const reports = await prisma.report.findMany();
    console.log(`Found ${reports.length} reports.`);

    console.log('\n--- Checking Categories ---');
    const categories = await prisma.category.findMany();
    console.log(`Found ${categories.length} categories.`);
  } catch (error) {
    console.error('❌ Database test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDB().catch(console.error);
