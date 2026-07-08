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
} from '@nestjs/common';
import { MaintenanceVisitsService } from './maintenance-visits.service';
import { CreateMaintenanceVisitDto } from './dto/create-maintenance-visit.dto';
import { UpdateMaintenanceVisitDto } from './dto/update-maintenance-visit.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/auth.service';

@Controller('maintenance-plans/:planId/visits')
export class MaintenanceVisitsController {
  constructor(private readonly visitsService: MaintenanceVisitsService) {}

  @Get()
  findAll(@Param('planId') planId: string) {
    return this.visitsService.findAll(planId);
  }

  @Get(':id')
  findOne(@Param('planId') planId: string, @Param('id') id: string) {
    return this.visitsService.findOne(planId, id);
  }

  @Post()
  create(
    @Param('planId') planId: string,
    @Body() dto: CreateMaintenanceVisitDto,
  ) {
    return this.visitsService.create(planId, dto);
  }

  @Patch(':id')
  update(
    @Param('planId') planId: string,
    @Param('id') id: string,
    @Body() dto: UpdateMaintenanceVisitDto,
  ) {
    return this.visitsService.update(planId, id, dto);
  }

  @Post(':id/generate-work-order')
  @HttpCode(HttpStatus.OK)
  generateWorkOrder(
    @Param('planId') planId: string,
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.visitsService.generateWorkOrder(planId, id, user.id);
  }

  @Patch(':id/cancel')
  cancel(@Param('planId') planId: string, @Param('id') id: string) {
    return this.visitsService.cancel(planId, id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('planId') planId: string, @Param('id') id: string) {
    return this.visitsService.remove(planId, id);
  }
}
