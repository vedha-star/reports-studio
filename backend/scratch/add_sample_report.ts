
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({
  connectionString: 'postgresql://postgres:12345@localhost:5432/navacle_report_studio',
});
const prisma = new PrismaClient({ adapter });

async function addSampleReport() {
  try {
    const user = await prisma.user.findFirst();
    if (!user) {
      console.error('No user found in database. Please register first.');
      return;
    }

    const report = await prisma.report.create({
      data: {
        name: 'Product Inventory Report',
        slug: 'product-inventory-report-' + Date.now(),
        database: 'erp',
        endpoint: 'inventory_v1',
        format: 'xlsx',
        status: 'active',
        authorId: user.id,
        columnMap: [
          { key: 'product_id', label: 'Product ID', type: 'string' },
          { key: 'name', label: 'Product Name', type: 'string' },
          { key: 'stock', label: 'Stock Level', type: 'number' },
          { key: 'warehouse', label: 'Warehouse', type: 'string' }
        ],
        parameters: [
          { key: 'warehouse_id', label: 'Warehouse ID', type: 'text', required: true },
          { key: 'min_stock', label: 'Min Stock', type: 'number', required: false }
        ],
        filters: [],
        config: {
          toggles: { showGrid: true, zebraStripes: true },
          orientation: 'landscape',
          sorts: []
        }
      }
    });

    console.log('Sample report created successfully! ID:', report.id);
  } catch (error) {
    console.error('Error creating sample report:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addSampleReport();
