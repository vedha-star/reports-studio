/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Injectable,
  NotFoundException,
  OnModuleInit,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { DynamicStudioService } from '../reports/dynamic-studio.service';

@Injectable()
export class SchedulesService implements OnModuleInit {
  private readonly logger = new Logger(SchedulesService.name);

  constructor(
    private prisma: PrismaService,
    private dynamicStudio: DynamicStudioService,
  ) {}

  onModuleInit() {
    this.logger.log('Scheduler Service Active - Scanning for jobs...');
    // In production, use BullMQ or Cron. For this demo, a simple 1-minute interval.
    setInterval(() => {
      void this.processSchedules();
    }, 60000);
  }

  async processSchedules() {
    try {
      const activeSchedules = await this.prisma.schedule.findMany({
        where: { status: 'active' },
      });

      for (const sched of activeSchedules) {
        // Find the linked report by name (temporary until reportId is added to schema)
        const report = await this.prisma.report.findFirst({
          where: { name: sched.reportName },
        });

        if (!report) {
          this.logger.warn(
            `Schedule ${sched.id} has no matching report: ${sched.reportName}`,
          );
          continue;
        }

        this.logger.log(`Executing Scheduled Job: ${sched.reportName}`);

        const start = Date.now();
        try {
          const data = await this.dynamicStudio.runQuery(
            report.endpoint || '',
            (report.parameters as any) || {},
            report.database || 'erp',
            (report.filters as any[]) || [],
          );

          await this.prisma.runHistory.create({
            data: {
              reportName: report.name,
              status: 'success',
              duration: Date.now() - start,
              rowCount: Array.isArray(data) ? data.length : 0,
              outputFormat: report.format || 'xlsx',
              trigger: 'scheduled',
              userId: (sched as any).userId,
            } as any,
          });
        } catch (err: any) {
          this.logger.error(
            `Scheduled Job Failed: ${sched.reportName}`,
            err.message,
          );
          await this.prisma.runHistory.create({
            data: {
              reportName: report.name,
              status: 'failed',
              duration: Date.now() - start,
              rowCount: 0,
              outputFormat: report.format || 'xlsx',
              trigger: 'scheduled',
              userId: (sched as any).userId,
              errorMessage: err.message,
            } as any,
          });
        }
      }
    } catch (error: any) {
      this.logger.error('Error in Scheduler Loop:', error.message);
    }
  }

  findAll(userId: string) {
    return this.prisma.schedule.findMany({
      where: { userId } as any,
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const schedule = await this.prisma.schedule.findUnique({
      where: { id },
    });
    if (!schedule) {
      throw new NotFoundException(`Schedule with ID ${id} not found`);
    }
    return schedule;
  }

  create(data: any) {
    return this.prisma.schedule.create({
      data,
    });
  }

  update(id: string, data: any) {
    return this.prisma.schedule.update({
      where: { id },

      data,
    });
  }

  delete(id: string) {
    return this.prisma.schedule.delete({
      where: { id },
    });
  }
}
