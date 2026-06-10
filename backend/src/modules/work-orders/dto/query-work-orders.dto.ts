import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { WorkOrderStatus } from '../../../generated/prisma/client';
import {
  WORK_ORDER_DEFAULT_LIMIT,
  WORK_ORDER_DEFAULT_PAGE,
  WORK_ORDER_MAX_LIMIT,
} from '../work-orders.constants';

export class QueryWorkOrdersDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = WORK_ORDER_DEFAULT_PAGE;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(WORK_ORDER_MAX_LIMIT)
  limit: number = WORK_ORDER_DEFAULT_LIMIT;

  @IsOptional()
  @IsString()
  clientId?: string;

  @IsOptional()
  @IsString()
  branchId?: string;

  @IsOptional()
  @IsEnum(WorkOrderStatus)
  status?: WorkOrderStatus;

  @IsOptional()
  @IsString()
  assignedToId?: string;

  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @IsOptional()
  @IsDateString()
  toDate?: string;

  @IsOptional()
  @IsString()
  search?: string;
}
