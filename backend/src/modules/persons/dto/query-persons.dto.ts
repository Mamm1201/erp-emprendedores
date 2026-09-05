import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { PersonProfile, RelationshipType } from '../../../generated/prisma/client';
import {
  PERSON_DEFAULT_LIMIT,
  PERSON_DEFAULT_PAGE,
  PERSON_MAX_LIMIT,
} from '../persons.constants';

export class QueryPersonsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = PERSON_DEFAULT_PAGE;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(PERSON_MAX_LIMIT)
  limit: number = PERSON_DEFAULT_LIMIT;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(PersonProfile)
  profile?: PersonProfile;

  @IsOptional()
  @IsEnum(RelationshipType)
  relationshipType?: RelationshipType;
}
