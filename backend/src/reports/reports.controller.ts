/* eslint-disable @typescript-eslint/no-unused-vars */

/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  UseGuards,
  Request,
  Res,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';
import { ReportsService } from './reports.service';
import { DynamicStudioService } from './dynamic-studio.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('v1/reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly dynamicStudioService: DynamicStudioService,
  ) {}

  @Get('dashboard/stats')
  getDashboardStats(@Request() req: any) {
    return this.reportsService.getDashboardStats(req.user.userId);
  }

  @Get()
  findAll(@Request() req: any) {
    return this.reportsService.findAll(req.user.userId);
  }

  @Get('categories')
  getCategories(@Request() req: any) {
    return this.reportsService.getCategories(req.user.userId);
  }

  @Post('categories')
  createCategory(@Body() body: any, @Request() req: any) {
    return this.reportsService.createCategory({
      ...body,
      createdBy: req.user.userId,
    });
  }

  @Delete('categories/:id')
  removeCategory(@Param('id') id: string) {
    return this.reportsService.removeCategory(id);
  }

  @Post('bulk-delete')
  bulkDelete(@Body() body: { ids: string[] }) {
    return this.reportsService.bulkDelete(body.ids);
  }

  @Post('bulk-clear-all')
  async clearAll(@Request() req: any) {
    const userId = req.user.userId;
    const prisma = (this.reportsService as any).prisma;

    await prisma.runHistory.deleteMany({ where: { userId } });
    await prisma.schedule.deleteMany({ where: { userId } });
    await prisma.report.deleteMany({ where: { authorId: userId } });
    await prisma.category.deleteMany({ where: { createdBy: userId } });

    return { success: true, message: 'Your workspace has been cleared.' };
  }

  @Post('bulk-toggle-status')
  bulkToggleStatus(
    @Body() body: { ids: string[]; status: 'active' | 'inactive' },
  ) {
    return this.reportsService.bulkToggleStatus(body.ids, body.status);
  }

  @Post('bulk-assign-category')
  bulkAssignCategory(@Body() body: { ids: string[]; categoryId: string }) {
    return this.reportsService.bulkAssignCategory(body.ids, body.categoryId);
  }

  @Post('import/json')
  async importJson(
    @Body() body: { reports?: any[]; categories?: any[] },
    @Request() req: any,
  ) {
    const results = { imported: 0, updated: 0, failed: 0 };

    // 1. Import Categories first
    const categoryMap = new Map<string, string>();
    if (body.categories && Array.isArray(body.categories)) {
      for (const cat of body.categories) {
        try {
          const { id, ...catData } = cat;
          const existing = await this.reportsService.findCategoryByName(
            catData.name,
          );
          if (existing) {
            categoryMap.set(id, existing.id);
          } else {
            const newCat = await this.reportsService.createCategory({
              ...catData,
              createdBy: req.user.userId,
            });
            categoryMap.set(id, newCat.id);
          }
        } catch (e) {
          console.error('[Import] Category error:', e);
        }
      }
    }

    // 2. Import Reports with Upsert logic
    if (body.reports && Array.isArray(body.reports)) {
      for (const report of body.reports) {
        try {
          const {
            id,
            category,
            createdAt,
            updatedAt,
            categoryId,
            authorId,
            author,
            ...rest
          } = report;
          const newCategoryId = categoryMap.get(categoryId) || categoryId;

          // Check if report with this slug already exists
          const existingReport = await (
            this.reportsService as any
          ).prisma.report.findUnique({
            where: { slug: rest.slug },
          });

          if (existingReport) {
            // Update existing
            await this.reportsService.update(existingReport.id, {
              ...rest,
              author: { connect: { id: req.user.userId } },
              ...(newCategoryId
                ? { category: { connect: { id: newCategoryId } } }
                : { category: { disconnect: true } }),
            });
            results.updated++;
          } else {
            // Create new
            await this.reportsService.create({
              ...rest,
              author: { connect: { id: req.user.userId } },
              ...(newCategoryId
                ? { category: { connect: { id: newCategoryId } } }
                : {}),
            });
            results.imported++;
          }
        } catch (e) {
          console.error('[Import] Report error:', e);
          results.failed++;
        }
      }
    }
    return { success: true, ...results };
  }

  @Post('export/all')
  async exportAll(@Request() req: any) {
    const [reports, categories] = await Promise.all([
      this.reportsService.findAll(req.user.userId),
      this.reportsService.getCategories(req.user.userId),
    ]);
    return { reports, categories };
  }

  @Post('export/categories')
  async exportCategories(@Request() req: any) {
    const categories = await this.reportsService.getCategories(req.user.userId);
    return { categories };
  }

  @Get('dynamic/endpoints')
  getEndpoints() {
    return this.dynamicStudioService.getEndpoints();
  }

  @Post('dynamic/execute/:slug')
  async executeDynamic(@Param('slug') slug: string, @Body() body: any) {
    const start = Date.now();
    const data = await this.dynamicStudioService.runQuery(
      slug,
      body?.parameters || {},
      body?.dbCode || 'erp',
    );

    return {
      messageType: 'SUCCESS',
      success: true,
      timestamp: new Date().toISOString(),
      data: data,
      message: 'Query executed successfully',
      messageCode: 'SUCCESS',
      metadata: {
        endpoint: slug,
        dbCode: body?.dbCode || 'erp',
        executionTimeMs: Date.now() - start,
        recordCount: Array.isArray(data) ? data.length : 0,
      },
    };
  }

  @Post(':id/execute')
  async executeReport(
    @Param('id') id: string,
    @Body() body: any,
    @Request() req: any,
  ) {
    console.log(`[ReportsController] Executing report for ID/Slug: ${id}`);
    const start = Date.now();
    try {
      const report = (await this.reportsService.findOne(id)) as any;

      if (!report.endpoint) {
        // eslint-disable-next-line prettier/prettier
        throw new BadRequestException(`Report "${report.name}" has no endpoint defined.`);
      }

      const data = await this.dynamicStudioService.runQuery(
        report.endpoint,
        body?.parameters || report.parameters || {},
        report.database || 'erp',
        report.filters || [],
        body?.sorts || report.config?.sorts || [],
      );

      // Log the run
      await (this.reportsService as any).prisma.runHistory.create({
        data: {
          reportName: report.name,
          status: 'success',
          duration: Date.now() - start,
          rowCount: Array.isArray(data) ? data.length : 0,
          outputFormat: report.format || 'json',
          trigger: 'manual_run',
          userId: req.user.userId,
        },
      });

      return {
        messageType: 'SUCCESS',
        success: true,
        timestamp: new Date().toISOString(),
        data: data,
        message: 'Query executed successfully',
        messageCode: 'SUCCESS',
        metadata: {
          endpoint: report.endpoint,
          dbCode: report.database || 'erp',
          executionTimeMs: Date.now() - start,
          recordCount: Array.isArray(data) ? data.length : 0,
        },
      };
    } catch (e: any) {
      console.error(`[ReportsController] Execution failed for ${id}:`, e);
      if (e instanceof BadRequestException) throw e;
      throw new InternalServerErrorException(e.message || 'Execution failed');
    }
  }

  @Get(':id/export')
  async exportReport(
    @Param('id') id: string,
    @Res() res: Response,
    @Request() req: any,
  ) {
    return this.reportsService.exportToExcel(id, res, req.user.userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.reportsService.findOne(id);
  }

  @Post()
  async create(@Body() body: any, @Request() req: any) {
    try {
      const {
        authorId,
        createdAt,
        updatedAt,
        author,
        categoryId,
        ...cleanBody
      } = body;
      return await this.reportsService.create({
        ...cleanBody,
        author: { connect: { id: req.user.userId } },
        ...(categoryId ? { category: { connect: { id: categoryId } } } : {}),
      });
    } catch (e: any) {
      console.error('[ReportsController] Create Error:', e);
      if (e.code === 'P2002') {
        throw new BadRequestException(
          'A report with this name or slug already exists.',
        );
      }
      throw new InternalServerErrorException(e.message || 'Create failed');
    }
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    try {
      const {
        id: _,
        category,
        authorId,
        createdAt,
        updatedAt,
        author,
        categoryId,
        ...rest
      } = body;
      return await this.reportsService.update(id, {
        ...rest,
        ...(categoryId
          ? { category: { connect: { id: categoryId } } }
          : { category: { disconnect: true } }),
      });
    } catch (e: any) {
      console.error('[ReportsController] Update Error:', e);
      if (e.code === 'P2002') {
        throw new BadRequestException(
          'A report with this name or slug already exists.',
        );
      }
      throw new InternalServerErrorException(e.message || 'Update failed');
    }
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.reportsService.remove(id);
  }
}
