import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import {
  BRANCH_DEFAULT_LIMIT,
  BRANCH_DEFAULT_PAGE,
  BRANCH_MAX_LIMIT,
} from '../branches.constants';

export class QueryBranchesDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = BRANCH_DEFAULT_PAGE;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(BRANCH_MAX_LIMIT)
  limit: number = BRANCH_DEFAULT_LIMIT;

  @IsOptional()
  @IsString()
  search?: string;
}
