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
import { EquipmentService } from './equipment.service';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { QueryEquipmentDto } from './dto/query-equipment.dto';
import { UpdateEquipmentDto } from './dto/update-equipment.dto';

@Controller('clients/:clientId/branches/:branchId/equipment')
export class EquipmentController {
  constructor(private readonly equipmentService: EquipmentService) {}

  @Get()
  findAll(
    @Param('clientId') clientId: string,
    @Param('branchId') branchId: string,
    @Query() query: QueryEquipmentDto,
  ) {
    return this.equipmentService.findAll(clientId, branchId, query);
  }

  @Get(':id')
  findOne(
    @Param('clientId') clientId: string,
    @Param('branchId') branchId: string,
    @Param('id') id: string,
  ) {
    return this.equipmentService.findOne(clientId, branchId, id);
  }

  @Post()
  create(
    @Param('clientId') clientId: string,
    @Param('branchId') branchId: string,
    @Body() dto: CreateEquipmentDto,
  ) {
    return this.equipmentService.create(clientId, branchId, dto);
  }

  @Patch(':id')
  update(
    @Param('clientId') clientId: string,
    @Param('branchId') branchId: string,
    @Param('id') id: string,
    @Body() dto: UpdateEquipmentDto,
  ) {
    return this.equipmentService.update(clientId, branchId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(
    @Param('clientId') clientId: string,
    @Param('branchId') branchId: string,
    @Param('id') id: string,
  ) {
    return this.equipmentService.remove(clientId, branchId, id);
  }
}
