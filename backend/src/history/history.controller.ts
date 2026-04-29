import { Controller, Get, Param, Post, Body } from '@nestjs/common';
import { HistoryService } from './history.service';

@Controller('v1/history')
export class HistoryController {
  constructor(private readonly historyService: HistoryService) {}

  @Get()
  findAll() {
    return this.historyService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.historyService.findOne(id);
  }

  @Post()
  create(@Body() data: any) {
    return this.historyService.create(data);
  }
}
