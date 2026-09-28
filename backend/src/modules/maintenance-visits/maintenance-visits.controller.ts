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
import { UpdateMaintenanceVisitDto } from './dto/update-maintenance-visit.dto';
import {
  CancelVisitDto,
  EarlyExecutionNoteDto,
  MarkNotAttendedDto,
} from './dto/visit-equipment.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/auth.service';

// Las visitas no se crean a mano: las genera el plan por periodo
// (POST /maintenance-plans/:id/sync-visits).
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

  @Post(':id/close-without-execution')
  @HttpCode(HttpStatus.OK)
  closeWithoutExecution(
    @Param('planId') planId: string,
    @Param('id') id: string,
  ) {
    return this.visitsService.closeWithoutExecution(planId, id);
  }

  @Patch(':id/cancel')
  cancel(
    @Param('planId') planId: string,
    @Param('id') id: string,
    @Body() dto: CancelVisitDto,
  ) {
    return this.visitsService.cancel(planId, id, dto);
  }

  @Patch(':id/equipment/:equipmentId/not-attended')
  markNotAttended(
    @Param('planId') planId: string,
    @Param('id') id: string,
    @Param('equipmentId') equipmentId: string,
    @Body() dto: MarkNotAttendedDto,
  ) {
    return this.visitsService.markEquipmentNotAttended(
      planId,
      id,
      equipmentId,
      dto,
    );
  }

  @Patch(':id/equipment/:equipmentId/pending')
  revertToPending(
    @Param('planId') planId: string,
    @Param('id') id: string,
    @Param('equipmentId') equipmentId: string,
  ) {
    return this.visitsService.revertEquipmentToPending(planId, id, equipmentId);
  }

  @Patch(':id/equipment/:equipmentId/early-note')
  setEarlyNote(
    @Param('planId') planId: string,
    @Param('id') id: string,
    @Param('equipmentId') equipmentId: string,
    @Body() dto: EarlyExecutionNoteDto,
  ) {
    return this.visitsService.setEarlyExecutionNote(
      planId,
      id,
      equipmentId,
      dto,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('planId') planId: string, @Param('id') id: string) {
    return this.visitsService.remove(planId, id);
  }
}
