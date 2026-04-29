/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class HistoryService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.runHistory.findMany({
      orderBy: { executedAt: 'desc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.runHistory.findUnique({
      where: { id },
    });
  }

  async create(data: any) {
    return this.prisma.runHistory.create({
      data: {
        reportName: data.reportName,
        status: data.status,
        duration: data.duration,
        rowCount: data.rowCount,
        outputFormat: data.outputFormat,
        trigger: data.trigger,
        errorMessage: data.errorMessage,
        executedAt: new Date(),
      },
    });
  }
}
