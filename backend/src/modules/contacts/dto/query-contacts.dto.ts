import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import {
  CONTACT_DEFAULT_LIMIT,
  CONTACT_DEFAULT_PAGE,
  CONTACT_MAX_LIMIT,
} from '../contacts.constants';

export class QueryContactsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = CONTACT_DEFAULT_PAGE;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(CONTACT_MAX_LIMIT)
  limit: number = CONTACT_DEFAULT_LIMIT;

  @IsOptional()
  @IsString()
  search?: string;
}
