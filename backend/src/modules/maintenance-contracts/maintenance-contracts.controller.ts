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
import { MaintenanceContractsService } from './maintenance-contracts.service';
import { CreateMaintenanceContractDto } from './dto/create-maintenance-contract.dto';
import { UpdateMaintenanceContractDto } from './dto/update-maintenance-contract.dto';
import { QueryMaintenanceContractsDto } from './dto/query-maintenance-contracts.dto';
import { AttachContractEquipmentDto } from './dto/attach-contract-equipment.dto';

@Controller('maintenance-contracts')
export class MaintenanceContractsController {
  constructor(
    private readonly contractsService: MaintenanceContractsService,
  ) {}

  @Get()
  findAll(@Query() query: QueryMaintenanceContractsDto) {
    return this.contractsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.contractsService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateMaintenanceContractDto) {
    return this.contractsService.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateMaintenanceContractDto,
  ) {
    return this.contractsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string) {
    return this.contractsService.remove(id);
  }

  @Get(':id/equipment')
  findEquipment(@Param('id') id: string) {
    return this.contractsService.findEquipment(id);
  }

  @Post(':id/equipment')
  attachEquipment(
    @Param('id') id: string,
    @Body() dto: AttachContractEquipmentDto,
  ) {
    return this.contractsService.attachEquipment(id, dto);
  }

  @Delete(':id/equipment/:equipmentId')
  @HttpCode(HttpStatus.OK)
  detachEquipment(
    @Param('id') id: string,
    @Param('equipmentId') equipmentId: string,
  ) {
    return this.contractsService.detachEquipment(id, equipmentId);
  }
}
