import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDatabase() {
  console.log('\n🔍 --- NAVACLE REPORT STUDIO DIAGNOSTICS ---\n');

  try {
    const reports = await prisma.report.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        endpoint: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    console.log(`Found ${reports.length} reports in database:`);
    console.table(reports);

    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true },
      take: 5,
    });

    console.log('\nSample Users:');
    console.table(users);
  } catch (error: any) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    console.error('❌ Database connection failed:', error.message);
  } finally {
    await prisma.$disconnect();
    console.log('\n--- End of Diagnostics ---\n');
  }
}

void checkDatabase();
