import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { OpportunityStage } from '../../../generated/prisma/client';
import {
  OPPORTUNITY_DEFAULT_LIMIT,
  OPPORTUNITY_DEFAULT_PAGE,
  OPPORTUNITY_MAX_LIMIT,
} from '../opportunities.constants';

export class QueryOpportunitiesDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = OPPORTUNITY_DEFAULT_PAGE;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(OPPORTUNITY_MAX_LIMIT)
  limit: number = OPPORTUNITY_DEFAULT_LIMIT;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(OpportunityStage)
  stage?: OpportunityStage;
}
