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
import { BillingPreparationsService } from './billing-preparations.service';
import { OpenBillingPreparationDto } from './dto/open-billing-preparation.dto';
import { SetLineResolutionDto } from './dto/set-line-resolution.dto';

@Controller('billing-preparations')
export class BillingPreparationsController {
  constructor(private readonly service: BillingPreparationsService) {}

  @Post()
  open(@Body() dto: OpenBillingPreparationDto, @CurrentUser() user: AuthUser) {
    return this.service.open(dto, user.id);
  }

  @Get('by-work-order/:workOrderId')
  findByWorkOrder(@Param('workOrderId') workOrderId: string) {
    return this.service.findByWorkOrder(workOrderId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post(':id/resolutions')
  setResolution(@Param('id') id: string, @Body() dto: SetLineResolutionDto) {
    return this.service.setResolution(id, dto);
  }

  @Delete(':id/resolutions/:utilizationId')
  @HttpCode(HttpStatus.OK)
  removeResolution(
    @Param('id') id: string,
    @Param('utilizationId') utilizationId: string,
  ) {
    return this.service.removeResolution(id, utilizationId);
  }

  @Patch(':id/confirm')
  confirm(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.service.confirm(id, user.id);
  }
}
