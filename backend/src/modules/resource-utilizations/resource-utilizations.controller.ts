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
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser } from '../auth/auth.service';
import { ResourceUtilizationsService } from './resource-utilizations.service';
import { CreateResourceUtilizationDto } from './dto/create-resource-utilization.dto';
import { UpdateResourceUtilizationDto } from './dto/update-resource-utilization.dto';

@Controller('work-orders/:workOrderId/resource-utilizations')
export class ResourceUtilizationsController {
  constructor(private readonly service: ResourceUtilizationsService) {}

  @Get()
  findAll(@Param('workOrderId') workOrderId: string) {
    return this.service.findByWorkOrder(workOrderId);
  }

  @Post()
  create(
    @Param('workOrderId') workOrderId: string,
    @Body() dto: CreateResourceUtilizationDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.create(workOrderId, dto, user.id);
  }

  @Patch(':id')
  update(
    @Param('workOrderId') workOrderId: string,
    @Param('id') id: string,
    @Body() dto: UpdateResourceUtilizationDto,
  ) {
    return this.service.update(workOrderId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('workOrderId') workOrderId: string, @Param('id') id: string) {
    return this.service.remove(workOrderId, id);
  }
}
