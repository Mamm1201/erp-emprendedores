import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import {
  MAINTENANCE_PLAN_DEFAULT_LIMIT,
  MAINTENANCE_PLAN_DEFAULT_PAGE,
  MAINTENANCE_PLAN_MAX_LIMIT,
} from '../maintenance-plans.constants';

export class QueryMaintenancePlansDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = MAINTENANCE_PLAN_DEFAULT_PAGE;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAINTENANCE_PLAN_MAX_LIMIT)
  limit: number = MAINTENANCE_PLAN_DEFAULT_LIMIT;

  @IsOptional()
  @IsString()
  clientId?: string;

  @IsOptional()
  @IsString()
  branchId?: string;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isActive?: boolean;
}
