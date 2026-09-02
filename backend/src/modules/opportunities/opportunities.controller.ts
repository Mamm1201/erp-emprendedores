import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser } from '../auth/auth.service';
import { OpportunitiesService } from './opportunities.service';
import { CreateOpportunityDto } from './dto/create-opportunity.dto';
import { UpdateOpportunityDto } from './dto/update-opportunity.dto';
import { UpdateOpportunityStageDto } from './dto/update-opportunity-stage.dto';
import { QueryOpportunitiesDto } from './dto/query-opportunities.dto';
import { GenerateQuotationDto } from './dto/generate-quotation.dto';

@Controller('accounts/:accountId/opportunities')
export class OpportunitiesController {
  constructor(private readonly opportunitiesService: OpportunitiesService) {}

  @Get()
  findAll(
    @Param('accountId') accountId: string,
    @Query() query: QueryOpportunitiesDto,
  ) {
    return this.opportunitiesService.findAll(accountId, query);
  }

  @Get(':id')
  findOne(@Param('accountId') accountId: string, @Param('id') id: string) {
    return this.opportunitiesService.findOne(accountId, id);
  }

  @Post()
  create(
    @Param('accountId') accountId: string,
    @Body() dto: CreateOpportunityDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.opportunitiesService.create(accountId, dto, user.id);
  }

  @Patch(':id')
  update(
    @Param('accountId') accountId: string,
    @Param('id') id: string,
    @Body() dto: UpdateOpportunityDto,
  ) {
    return this.opportunitiesService.update(accountId, id, dto);
  }

  @Patch(':id/stage')
  updateStage(
    @Param('accountId') accountId: string,
    @Param('id') id: string,
    @Body() dto: UpdateOpportunityStageDto,
  ) {
    return this.opportunitiesService.updateStage(accountId, id, dto);
  }

  @Post(':id/quotations')
  generateQuotation(
    @Param('accountId') accountId: string,
    @Param('id') id: string,
    @Body() dto: GenerateQuotationDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.opportunitiesService.generateQuotation(
      accountId,
      id,
      dto,
      user.id,
    );
  }

  @Post(':id/services/:serviceId')
  linkService(
    @Param('accountId') accountId: string,
    @Param('id') id: string,
    @Param('serviceId') serviceId: string,
  ) {
    return this.opportunitiesService.linkService(accountId, id, serviceId);
  }

  @Delete(':id/services/:serviceId')
  unlinkService(
    @Param('accountId') accountId: string,
    @Param('id') id: string,
    @Param('serviceId') serviceId: string,
  ) {
    return this.opportunitiesService.unlinkService(accountId, id, serviceId);
  }
}
