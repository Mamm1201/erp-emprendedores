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
}
