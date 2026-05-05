import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';

@Controller('v1/reports/categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  // GET /v1/reports/categories - Section 7.1 PRD
  @Get()
  findAll() {
    return this.categoriesService.findAll();
  }

  // POST /v1/reports/categories - Section 7.1 PRD
  @Post()
  create(
    @Body()
    body: {
      name: string;
      description?: string;
      icon?: string;
      color?: string;
      textColor?: string;
      createdBy?: string;
    },
  ) {
    return this.categoriesService.create(body);
  }

  // PUT /v1/reports/categories/:id - Section 7.1 PRD
  @Put(':id')
  update(
    @Param('id') id: string,
    @Body()
    body: {
      name?: string;
      description?: string;
      icon?: string;
      color?: string;
      textColor?: string;
    },
  ) {
    return this.categoriesService.update(id, body);
  }

  // DELETE /v1/reports/categories/:id - Section 7.1 PRD
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.categoriesService.remove(id);
  }

  // PUT /v1/reports/categories/:id/reports - Section 7.1 PRD
  @Put(':id/reports')
  updateReports(
    @Param('id') id: string,
    @Body() body: { reportIds: string[] },
  ) {
    return this.categoriesService.updateReports(id, body.reportIds);
  }
}
