import { Module } from '@nestjs/common';
import { SchedulesService } from './schedules.service';
import { SchedulesController } from './schedules.controller';
import { PrismaService } from '../prisma.service';

import { ReportsModule } from '../reports/reports.module';

@Module({
  imports: [ReportsModule],
  controllers: [SchedulesController],
  providers: [SchedulesService, PrismaService],
})
export class SchedulesModule {}
