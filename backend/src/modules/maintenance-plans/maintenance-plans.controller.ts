import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { MaintenancePlansService } from './maintenance-plans.service';
import { CreateMaintenancePlanDto } from './dto/create-maintenance-plan.dto';
import { QueryMaintenancePlansDto } from './dto/query-maintenance-plans.dto';
import { UpdateMaintenancePlanDto } from './dto/update-maintenance-plan.dto';

@Controller('maintenance-plans')
export class MaintenancePlansController {
  constructor(
    private readonly maintenancePlansService: MaintenancePlansService,
  ) {}

  @Get()
  findAll(@Query() query: QueryMaintenancePlansDto) {
    return this.maintenancePlansService.findAll(query);
  }

  @Get('upcoming')
  findUpcoming(@Query('days') days?: string) {
    const d = days ? parseInt(days, 10) : 30;
    return this.maintenancePlansService.findUpcoming(d);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.maintenancePlansService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateMaintenancePlanDto) {
    return this.maintenancePlansService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateMaintenancePlanDto) {
    return this.maintenancePlansService.update(id, dto);
  }
}
