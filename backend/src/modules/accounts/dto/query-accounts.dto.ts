import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { AccountStatus } from '../../../generated/prisma/client';
import {
  ACCOUNT_DEFAULT_LIMIT,
  ACCOUNT_DEFAULT_PAGE,
  ACCOUNT_MAX_LIMIT,
} from '../accounts.constants';

export class QueryAccountsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = ACCOUNT_DEFAULT_PAGE;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(ACCOUNT_MAX_LIMIT)
  limit: number = ACCOUNT_DEFAULT_LIMIT;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(AccountStatus)
  status?: AccountStatus;
}
