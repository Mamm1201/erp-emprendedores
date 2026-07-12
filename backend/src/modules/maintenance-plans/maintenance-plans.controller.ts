import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { MaintenancePlansService } from './maintenance-plans.service';
import { CreateMaintenancePlanDto } from './dto/create-maintenance-plan.dto';
import { QueryMaintenancePlansDto } from './dto/query-maintenance-plans.dto';
import { QueryUpcomingDto } from './dto/query-upcoming.dto';
import { UpdateMaintenancePlanDto } from './dto/update-maintenance-plan.dto';
import { AttachPlanEquipmentDto } from './dto/attach-plan-equipment.dto';

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
  findUpcoming(@Query() query: QueryUpcomingDto) {
    return this.maintenancePlansService.findUpcoming(query.days);
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

  @Get(':id/equipment')
  findEquipment(@Param('id') id: string) {
    return this.maintenancePlansService.findEquipment(id);
  }

  @Post(':id/equipment')
  attachEquipment(
    @Param('id') id: string,
    @Body() dto: AttachPlanEquipmentDto,
  ) {
    return this.maintenancePlansService.attachEquipment(id, dto);
  }

  @Delete(':id/equipment/:equipmentId')
  @HttpCode(HttpStatus.OK)
  detachEquipment(
    @Param('id') id: string,
    @Param('equipmentId') equipmentId: string,
  ) {
    return this.maintenancePlansService.detachEquipment(id, equipmentId);
  }
}
