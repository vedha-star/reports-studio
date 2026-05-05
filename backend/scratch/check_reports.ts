import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const reports = await prisma.report.findMany();
  console.log(JSON.stringify(reports, null, 2));
}

// eslint-disable-next-line prettier/prettier
main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
