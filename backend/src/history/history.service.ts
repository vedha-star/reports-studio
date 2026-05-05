import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { RunHistory, Prisma } from '@prisma/client';

@Injectable()
export class HistoryService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string) {
    const history = await this.prisma.runHistory.findMany({
      where: { userId } as unknown as Prisma.RunHistoryWhereInput,
      orderBy: { executedAt: 'desc' },
    });

    // Remove duplicates: Keep only the most recent run for each report name
    const uniqueMap = new Map<string, RunHistory>();
    history.forEach((run) => {
      if (!uniqueMap.has(run.reportName)) {
        uniqueMap.set(run.reportName, run);
      }
    });

    return Array.from(uniqueMap.values());
  }

  async findOne(id: string) {
    return this.prisma.runHistory.findUnique({
      where: { id },
    });
  }

  async create(data: Prisma.RunHistoryCreateInput) {
    return this.prisma.runHistory.create({
      data: {
        ...data,
        executedAt: new Date(),
      },
    });
  }
}
