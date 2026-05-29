import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import {
  CLIENT_DEFAULT_LIMIT,
  CLIENT_DEFAULT_PAGE,
  CLIENT_MAX_LIMIT,
} from '../clients.constants';

export class QueryClientsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = CLIENT_DEFAULT_PAGE;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(CLIENT_MAX_LIMIT)
  limit: number = CLIENT_DEFAULT_LIMIT;

  @IsOptional()
  @IsString()
  search?: string;
}
