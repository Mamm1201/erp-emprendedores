import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser } from '../auth/auth.service';
import { ActivitiesService } from './activities.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { QueryActivitiesDto } from './dto/query-activities.dto';

@Controller('accounts/:accountId/activities')
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Get()
  findAll(
    @Param('accountId') accountId: string,
    @Query() query: QueryActivitiesDto,
  ) {
    return this.activitiesService.findAll(accountId, query);
  }

  @Get(':id')
  findOne(@Param('accountId') accountId: string, @Param('id') id: string) {
    return this.activitiesService.findOne(accountId, id);
  }

  @Post()
  create(
    @Param('accountId') accountId: string,
    @Body() dto: CreateActivityDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.activitiesService.create(accountId, dto, user.id);
  }

  @Patch(':id')
  update(
    @Param('accountId') accountId: string,
    @Param('id') id: string,
    @Body() dto: UpdateActivityDto,
  ) {
    return this.activitiesService.update(accountId, id, dto);
  }
}
