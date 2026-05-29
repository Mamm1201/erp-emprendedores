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
import { BranchesService } from './branches.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { QueryBranchesDto } from './dto/query-branches.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';

@Controller('clients/:clientId/branches')
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Get()
  findAll(
    @Param('clientId') clientId: string,
    @Query() query: QueryBranchesDto,
  ) {
    return this.branchesService.findAll(clientId, query);
  }

  @Get(':id')
  findOne(@Param('clientId') clientId: string, @Param('id') id: string) {
    return this.branchesService.findOne(clientId, id);
  }

  @Post()
  create(
    @Param('clientId') clientId: string,
    @Body() dto: CreateBranchDto,
  ) {
    return this.branchesService.create(clientId, dto);
  }

  @Patch(':id')
  update(
    @Param('clientId') clientId: string,
    @Param('id') id: string,
    @Body() dto: UpdateBranchDto,
  ) {
    return this.branchesService.update(clientId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('clientId') clientId: string, @Param('id') id: string) {
    return this.branchesService.remove(clientId, id);
  }
}
