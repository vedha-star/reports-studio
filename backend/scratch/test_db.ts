
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

async function testDB() {
  const connectionString = 'postgresql://postgres:12345@localhost:5432/navacle_report_studio';
  const pool = new pg.Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    console.log('Connecting to DB...');
    await prisma.$connect();
    console.log('Connected!');
    
    const count = await prisma.user.count();
    console.log(`User count: ${count}`);
    
    const users = await prisma.user.findMany();
    console.log('Users:', users.map(u => u.email));
    
  } catch (error: any) {
    console.error('DB Error:', error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

testDB();
