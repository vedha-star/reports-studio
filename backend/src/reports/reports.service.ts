/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import * as ExcelJS from 'exceljs';
import { Response } from 'express';
import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Report } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { DynamicStudioService } from './dynamic-studio.service';

@Injectable()
export class ReportsService {
  constructor(
    public prisma: PrismaService,
    private dynamicStudio: DynamicStudioService,
  ) {}

  findAll(authorId: string) {
    return this.prisma.report.findMany({
      where: { authorId },
      include: { category: true } as any,
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findOne(idOrSlug: string) {
    const report = await this.prisma.report.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
      },
      include: { category: true } as any,
    });
    if (!report) throw new NotFoundException(`Report ${idOrSlug} not found`);
    return report;
  }

  create(data: Prisma.ReportCreateInput) {
    return this.prisma.report.create({ data });
  }

  update(id: string, data: Prisma.ReportUpdateInput) {
    return this.prisma.report.update({ where: { id }, data });
  }

  remove(id: string) {
    return this.prisma.report.delete({ where: { id } });
  }

  getCategories(userId: string) {
    return this.prisma.category.findMany({
      where: { createdBy: userId },
      orderBy: { name: 'asc' },
    });
  }

  createCategory(data: Prisma.CategoryCreateInput) {
    return this.prisma.category.create({ data });
  }

  removeCategory(id: string) {
    return this.prisma.category.delete({ where: { id } });
  }

  findCategoryByName(name: string) {
    return this.prisma.category.findFirst({ where: { name } });
  }

  async bulkDelete(ids: string[]) {
    return this.prisma.report.deleteMany({
      where: { id: { in: ids } },
    });
  }

  async bulkToggleStatus(ids: string[], status: 'active' | 'inactive') {
    return this.prisma.report.updateMany({
      where: { id: { in: ids } },
      data: { status },
    });
  }

  async bulkAssignCategory(ids: string[], categoryId: string) {
    return this.prisma.report.updateMany({
      where: { id: { in: ids } },
      data: { categoryId: categoryId === 'uncat' ? null : categoryId },
    });
  }

  async getDashboardStats(authorId: string) {
    const where = { authorId };

    const [totalReports, totalCategories, todayRuns] = await Promise.all([
      this.prisma.report.count({ where }),
      this.prisma.category.count({ where: { createdBy: authorId } }),
      this.prisma.runHistory.count({
        where: {
          userId: authorId,
          executedAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
          status: 'success',
        } as any,
      }),
    ]);

    return {
      totalReports,
      totalCategories,
      todayRuns,
      uptime: '99.9%',
    };
  }

  async exportToExcel(id: string, res: Response, userId?: string) {
    const report = (await this.findOne(id)) as any;
    const data = await this.dynamicStudio.runQuery(
      report.endpoint,
      report.parameters || {},
      report.database || 'erp',
      report.filters || [],
      report.config?.sorts || [],
    );

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(report.name);

    if (Array.isArray(data) && data.length > 0) {
      const headers = Object.keys(data[0]);
      worksheet.columns = headers.map((h) => ({
        header: h.toUpperCase(),
        key: h,
        width: 20,
      }));
      worksheet.addRows(data);

      // Simple styling
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' },
      };
    } else {
      worksheet.addRow(['No data found or invalid data format']);
    }

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=${report.slug}.xlsx`,
    );

    await workbook.xlsx.write(res);
    res.end();

    // Log the run
    await this.prisma.runHistory.create({
      data: {
        reportName: report.name,
        status: 'success',
        duration: 0,
        rowCount: Array.isArray(data) ? data.length : 0,
        outputFormat: 'xlsx',
        trigger: 'manual_export',
        userId: userId,
      } as any,
    });
  }
}
