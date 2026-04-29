/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({
  connectionString:
    'postgresql://postgres:12345@localhost:5432/navacle_report_studio',
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding samples...');

  const user = await prisma.user.findFirst();
  if (!user) {
    console.error('No user found! Please register first.');
    return;
  }

  const authorId = user.id;

  const categories = [
    { name: 'Admission', icon: '🎓', color: '#10B981' },
    { name: 'Academic', icon: '📚', color: '#3B82F6' },
    { name: 'Accounts', icon: '🏦', color: '#F59E0B' },
    { name: 'Inventory', icon: '📦', color: '#6366F1' },
  ];

  const catMap: Record<string, string> = {};

  for (const cat of categories) {
    const upserted = await prisma.category.upsert({
      where: { name: cat.name },
      update: cat,
      create: cat,
    });
    catMap[cat.name] = upserted.id;
    console.log(`Category ${cat.name} ready.`);
  }

  const sampleReports = [
    {
      name: 'Daily Admission Summary',
      slug: 'daily-admission-summary',
      database: 'ERP',
      endpoint: 'select enquiry',
      format: 'xlsx',
      status: 'active',
      categoryId: catMap['Admission'],
      authorId,
      isPublic: true,
      columnMap: [
        { id: '1', field: 'enquiry_no', label: 'ENQUIRY NO', vis: true },
        { id: '2', field: 'parent_name', label: 'PARENT NAME', vis: true },
        { id: '3', field: 'parent_phone', label: 'PHONE', vis: true },
      ],
    },
    {
      name: 'Student Grade Sheet',
      slug: 'student-grade-sheet',
      database: 'ERP',
      endpoint: 'vp_student_grades',
      format: 'pdf',
      status: 'active',
      categoryId: catMap['Academic'],
      authorId,
      isPublic: true,
    },
    {
      name: 'Fee Collection Ledger',
      slug: 'fee-collection-ledger',
      database: 'Finance',
      endpoint: 'vp_fee_collection',
      format: 'xlsx',
      status: 'active',
      categoryId: catMap['Accounts'],
      authorId,
      isPublic: true,
    },
    {
      name: 'Stock Valuation Report',
      slug: 'stock-valuation',
      database: 'Inventory',
      endpoint: 'vp_stock_list',
      format: 'csv',
      status: 'draft',
      categoryId: catMap['Inventory'],
      authorId,
      isPublic: true,
    },
  ];

  for (const report of sampleReports) {
    const data = { ...report } as any;
    await prisma.report.upsert({
      where: { slug: report.slug },
      update: data,
      create: data,
    });
    console.log(`Report ${report.name} seeded.`);
  }

  console.log('Seeding complete! 🚀');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
