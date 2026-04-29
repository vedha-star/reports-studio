/* eslint-disable @typescript-eslint/no-unsafe-return */
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
  getCategories() {
    return this.reportsService.getCategories();
  }

  @Post('categories')
  createCategory(@Body() body: any) {
    return this.reportsService.createCategory(body);
  }

  @Delete('categories/:id')
  removeCategory(@Param('id') id: string) {
    return this.reportsService.removeCategory(id);
  }

  @Post('bulk-delete')
  bulkDelete(@Body() body: { ids: string[] }) {
    return this.reportsService.bulkDelete(body.ids);
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
  async importJson(@Body() body: { reports: any[] }) {
    for (const report of body.reports) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, category, createdAt, updatedAt, ...rest } = report;
      await this.reportsService.create(rest);
    }
    return { success: true };
  }

  @Post('export/all')
  async exportAll(@Request() req: any) {
    const reports = await this.reportsService.findAll(req.user.userId);
    return { reports };
  }

  @Get('dynamic/endpoints')
  getEndpoints() {
    return this.dynamicStudioService.getEndpoints();
  }

  @Post('dynamic/execute/:slug')
  executeDynamic(@Param('slug') slug: string, @Body() body: any) {
    return this.dynamicStudioService.runQuery(
      slug,
      body?.parameters || {},
      body?.dbCode || 'erp',
    );
  }

  @Post(':id/execute')
  async executeReport(@Param('id') id: string, @Body() body: any) {
    console.log(`[ReportsController] Executing report for ID/Slug: ${id}`);
    const start = Date.now();
    try {
      const report = (await this.reportsService.findOne(id)) as any;
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
        },
      });

      return data;
    } catch (e) {
      console.error(
        `[ReportsController] Execution failed for ${id}:`,
        e.message,
      );
      throw e;
    }
  }

  @Get(':id/export')
  async exportReport(@Param('id') id: string, @Res() res: Response) {
    return this.reportsService.exportToExcel(id, res);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.reportsService.findOne(id);
  }

  @Post()
  create(@Body() body: any, @Request() req: any) {
    return this.reportsService.create({
      ...body,
      author: { connect: { id: req.user.userId } },
    });
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: any) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _, category, ...rest } = body;
    return this.reportsService.update(id, rest);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.reportsService.remove(id);
  }
}
