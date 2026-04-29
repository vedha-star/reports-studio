/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://postgres:12345@localhost:5432/navacle_report_studio';
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('--- Seeding Process Started ---');

  // 0. Clean Existing Data (Optional but recommended for a fresh test)
  console.log('Cleaning existing data...');
  // @ts-ignore
  await prisma.runHistory.deleteMany({});
  await prisma.schedule.deleteMany({});
  await prisma.report.deleteMany({});
  await prisma.category.deleteMany({});

  // 1. Seed Categories
  console.log('Seeding categories...');
  const categories = [
    {
      id: 'cat-finance',
      name: 'Finance',
      icon: '💰',
      color: '#2563EB',
      textColor: '#FFFFFF',
      description: 'Financial reports and revenue tracking.',
    },
    {
      id: 'cat-hr',
      name: 'Human Resources',
      icon: '👥',
      color: '#7C3AED',
      textColor: '#FFFFFF',
      description: 'Employee management and attendance.',
    },
    {
      id: 'cat-admissions',
      name: 'Admissions',
      icon: '🎓',
      color: '#16A34A',
      textColor: '#FFFFFF',
      description: 'Student enrollment and enquiry data.',
    },
    {
      id: 'cat-operations',
      name: 'Operations',
      icon: '⚙️',
      color: '#EA580C',
      textColor: '#FFFFFF',
      description: 'Daily operations and logs.',
    },
    {
      id: 'cat-marketing',
      name: 'Marketing',
      icon: '📢',
      color: '#DB2777',
      textColor: '#FFFFFF',
      description: 'Campaign performance and analytics.',
    },
  ];

  for (const cat of categories) {
    await prisma.category.create({
      data: {
        ...cat,
        reportIds: [],
      },
    });
  }

  // 2. Seed Reports
  console.log('Seeding reports...');
  const reports = [
    {
      id: 'rpt-rev-001',
      name: 'Monthly Revenue Summary',
      slug: 'monthly-revenue',
      description: 'Breakdown of revenue by department and region.',
      format: 'xlsx',
      database: 'ERP_PROD',
      categoryId: 'cat-finance',
      config: { queries: ['SELECT * FROM revenue'], version: '1.0' },
    },
    {
      id: 'rpt-fin-002',
      name: 'Quarterly Profit/Loss',
      slug: 'quarterly-pl',
      description: 'Consolidated profit and loss statement.',
      format: 'pdf',
      database: 'FINANCE_DB',
      categoryId: 'cat-finance',
      config: { orientation: 'landscape', theme: 'professional' },
    },
    {
      id: 'rpt-hr-001',
      name: 'Staff Attendance Log',
      slug: 'hr-attendance',
      description: 'Daily clock-in/out records for all employees.',
      format: 'csv',
      database: 'HRMS',
      categoryId: 'cat-hr',
      config: { filters: ['department', 'date_range'] },
    },
    {
      id: 'rpt-hr-002',
      name: 'Employee Performance Review',
      slug: 'staff-performance',
      description: 'Annual performance metrics and feedback.',
      format: 'pdf',
      database: 'HRMS',
      categoryId: 'cat-hr',
      config: { confidential: true },
    },
    {
      id: 'rpt-adm-001',
      name: 'Student Enrollment 2025',
      slug: 'student-enrollment',
      description: 'Current active student list for the academic year.',
      format: 'xlsx',
      database: 'STUDENT_SIS',
      categoryId: 'cat-admissions',
      config: { include_deleted: false },
    },
    {
      id: 'rpt-adm-002',
      name: 'Daily Enquiry Report',
      slug: 'enquiry-report',
      description: 'New enquiries received via web and walk-ins.',
      format: 'csv',
      database: 'CRM_SALES',
      categoryId: 'cat-admissions',
      config: { source: 'all' },
    },
    {
      id: 'rpt-ops-001',
      name: 'Warehouse Inventory Status',
      slug: 'inventory-status',
      description: 'Real-time stock levels of all warehouse items.',
      format: 'json',
      database: 'WMS_PROD',
      categoryId: 'cat-operations',
      config: { alert_threshold: 10 },
    },
    {
      id: 'rpt-mkt-001',
      name: 'Email Campaign Analytics',
      slug: 'campaign-performance',
      description: 'Open rates, CTR, and conversion tracking.',
      format: 'pdf',
      database: 'MARKETING_CLOUD',
      categoryId: 'cat-marketing',
      config: { campaign_id: 'auto' },
    },
  ];

  for (const report of reports) {
    await prisma.report.create({
      data: report,
    });
  }

  // 3. Seed Schedules
  console.log('Seeding schedules...');
  const schedules = [
    {
      id: 'sch-001',
      reportName: 'Monthly Revenue Summary',
      cron: '0 8 1 * *',
      frequency: 'Monthly',
      time: '08:00',
      timezone: 'UTC+5:30',
      format: 'xlsx',
      delivery: 'Email',
      recipient: 'finance-leads@navacle.io',
      status: 'active',
      successRate: 98.5,
      totalRuns: 12,
      lastRun: '2024-04-01 08:00',
      nextRun: '2024-05-01 08:00',
    },
    {
      id: 'sch-002',
      reportName: 'Staff Attendance Log',
      cron: '0 9 * * 1-5',
      frequency: 'Daily',
      time: '09:00',
      timezone: 'UTC+5:30',
      format: 'csv',
      delivery: 'Slack',
      recipient: '#hr-alerts',
      status: 'active',
      successRate: 100,
      totalRuns: 45,
      lastRun: '2024-04-19 09:00',
      nextRun: '2024-04-22 09:00',
    },
    {
      id: 'sch-003',
      reportName: 'Warehouse Inventory Status',
      cron: '0 */4 * * *',
      frequency: 'Every 4 Hours',
      time: 'HH:00',
      timezone: 'UTC+5:30',
      format: 'json',
      delivery: 'Webhook',
      recipient: 'https://api.navacle.io/webhooks/inventory',
      status: 'active',
      successRate: 92.1,
      totalRuns: 120,
      lastRun: '2024-04-20 16:00',
      nextRun: '2024-04-20 20:00',
    },
    {
      id: 'sch-004',
      reportName: 'Quarterly Profit/Loss',
      cron: '0 0 1 1,4,7,10 *',
      frequency: 'Quarterly',
      time: '00:00',
      timezone: 'UTC+5:30',
      format: 'pdf',
      delivery: 'Email',
      recipient: 'exec-board@navacle.io',
      status: 'paused',
      successRate: 100,
      totalRuns: 4,
      lastRun: '2024-04-01 00:00',
      nextRun: '2024-07-01 00:00',
    },
    {
      id: 'sch-005',
      reportName: 'Daily Enquiry Report',
      cron: '30 23 * * *',
      frequency: 'Daily',
      time: '23:30',
      timezone: 'UTC+5:30',
      format: 'csv',
      delivery: 'Email',
      recipient: 'sales-daily@navacle.io',
      status: 'failed',
      successRate: 85.0,
      totalRuns: 10,
      lastRun: '2024-04-19 23:30',
      nextRun: '2024-04-20 23:30',
    },
  ];

  for (const sched of schedules) {
    await prisma.schedule.create({
      data: sched,
    });
  }

  // 4. Seed Run History
  console.log('Seeding run history (30+ entries)...');
  const statuses = ['success', 'failed', 'processing'];
  const triggers = ['manual', 'scheduled'];
  const formats = ['xlsx', 'pdf', 'csv', 'json'];
  const reportNames = reports.map((r) => r.name);

  const runHistoryData: any[] = [];

  // Add some specific entries
  runHistoryData.push({
    reportName: 'Monthly Revenue Summary',
    status: 'success',
    duration: 1540,
    outputFormat: 'xlsx',
    trigger: 'scheduled',
    executedAt: new Date(),
  });

  // Generate 30 random entries for better visualization
  for (let i = 0; i < 30; i++) {
    const randomStatus = statuses[Math.floor(Math.random() * (i < 5 ? 1 : 2))]; // More successes early on
    runHistoryData.push({
      reportName: reportNames[Math.floor(Math.random() * reportNames.length)],
      status: randomStatus,
      duration: Math.floor(Math.random() * 3000) + 200,
      outputFormat: formats[Math.floor(Math.random() * formats.length)],
      trigger: triggers[Math.floor(Math.random() * triggers.length)],
      errorMessage:
        randomStatus === 'failed'
          ? 'Internal Server Error: Database timeout after 30s'
          : null,
      executedAt: new Date(Date.now() - i * 3600000 * 2), // Spread across last 60 hours
    });
  }

  for (const history of runHistoryData) {
    // @ts-ignore - Prisma client types sometimes lag in the IDE
    await prisma.runHistory.create({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      data: history,
    });
  }

  console.log('--- Seeding Process Complete ---');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
