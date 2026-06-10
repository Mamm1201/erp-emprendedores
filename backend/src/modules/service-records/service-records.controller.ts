import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ServiceRecordsService } from './service-records.service';
import { CreateServiceRecordDto } from './dto/create-service-record.dto';
import { UpdateServiceRecordDto } from './dto/update-service-record.dto';
import { UpdateChecklistItemDto } from './dto/checklist-item.dto';

@Controller()
export class ServiceRecordsController {
  constructor(
    private readonly serviceRecordsService: ServiceRecordsService,
  ) {}

  @Post('work-orders/:workOrderId/service-record')
  create(
    @Param('workOrderId') workOrderId: string,
    @Body() dto: CreateServiceRecordDto,
  ) {
    return this.serviceRecordsService.create(workOrderId, dto);
  }

  @Get('work-orders/:workOrderId/service-record')
  findByWorkOrder(@Param('workOrderId') workOrderId: string) {
    return this.serviceRecordsService.findByWorkOrder(workOrderId);
  }

  @Patch('work-orders/:workOrderId/service-record')
  update(
    @Param('workOrderId') workOrderId: string,
    @Body() dto: UpdateServiceRecordDto,
  ) {
    return this.serviceRecordsService.update(workOrderId, dto);
  }

  @Patch('work-orders/:workOrderId/service-record/checklist/:itemId')
  updateChecklistItem(
    @Param('workOrderId') workOrderId: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateChecklistItemDto,
  ) {
    return this.serviceRecordsService.updateChecklistItem(
      workOrderId,
      itemId,
      dto,
    );
  }

  @Get('equipment/:equipmentId/service-records')
  findByEquipment(@Param('equipmentId') equipmentId: string) {
    return this.serviceRecordsService.findByEquipment(equipmentId);
  }
}
