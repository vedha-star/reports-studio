import { Module } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { PrismaService } from '../prisma.service';
import { DynamicStudioService } from './dynamic-studio.service';

@Module({
  controllers: [ReportsController],
  providers: [ReportsService, PrismaService, DynamicStudioService],
  exports: [DynamicStudioService],
})
export class ReportsModule {}
