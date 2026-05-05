import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  // GET /v1/reports/categories - Section 7.1 PRD
  findAll() {
    return this.prisma.category.findMany();
  }

  // POST /v1/reports/categories - Section 7.1 PRD
  create(data: {
    name: string;
    description?: string;
    icon?: string;
    color?: string;
    textColor?: string;
    createdBy?: string;
  }) {
    return this.prisma.category.create({ data });
  }

  // PUT /v1/reports/categories/:id - Section 7.1 PRD
  update(
    id: string,
    data: {
      name?: string;
      description?: string;
      icon?: string;
      color?: string;
      textColor?: string;
    },
  ) {
    return this.prisma.category.update({ where: { id }, data });
  }

  // DELETE /v1/reports/categories/:id - Section 7.1 PRD
  async remove(id: string) {
    // First nullify categoryId in reports
    await this.prisma.report.updateMany({
      where: { categoryId: id },
      data: { categoryId: null },
    });
    return this.prisma.category.delete({ where: { id } });
  }

  // PUT /v1/reports/categories/:id/reports - Section 7.1 PRD
  updateReports(id: string, reportIds: string[]) {
    return this.prisma.category.update({
      where: { id },
      data: {
        reports: {
          set: reportIds.map((rid) => ({ id: rid })),
        },
      } as any,
    });
  }
}
