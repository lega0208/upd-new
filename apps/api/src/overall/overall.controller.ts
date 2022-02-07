import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { OverallService } from './overall.service';
import { CreateOverallDto } from './dto/create-overall.dto';
import { UpdateOverallDto } from './dto/update-overall.dto';

@Controller('overall')
export class OverallController {
  constructor(private readonly overallService: OverallService) {}

  @Post()
  create(@Body() createOverallDto: CreateOverallDto) {
    return this.overallService.create(createOverallDto);
  }

  @Get()
  getMetrics(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string
  ) {
    return this.overallService.getMetrics({ startDate, endDate });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.overallService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateOverallDto: UpdateOverallDto) {
    return this.overallService.update(id, updateOverallDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.overallService.remove(id);
  }
}
