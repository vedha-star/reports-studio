import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
} from '@nestjs/common';
import { SchedulesService } from './schedules.service';

@Controller('v1/schedules')
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}

  @Get()
  findAll() {
    return this.schedulesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.schedulesService.findOne(id);
  }

  @Post()
  create(@Body() data: any) {
    return this.schedulesService.create(data);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() data: any) {
    return this.schedulesService.update(id, data);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.schedulesService.delete(id);
  }
}
