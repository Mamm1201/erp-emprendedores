import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { ActivityStatus } from '../../../generated/prisma/client';
import {
  ACTIVITY_DEFAULT_LIMIT,
  ACTIVITY_DEFAULT_PAGE,
  ACTIVITY_MAX_LIMIT,
} from '../activities.constants';

export class QueryActivitiesDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = ACTIVITY_DEFAULT_PAGE;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(ACTIVITY_MAX_LIMIT)
  limit: number = ACTIVITY_DEFAULT_LIMIT;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(ActivityStatus)
  status?: ActivityStatus;
}
