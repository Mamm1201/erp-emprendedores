import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import {
  LeadSource,
  OpportunityPriority,
} from '../../../generated/prisma/client';

export class CreateOpportunityDto {
  @IsOptional()
  @IsString()
  primaryContactId?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  detectedNeed?: string;

  @IsOptional()
  @IsEnum(OpportunityPriority)
  priority?: OpportunityPriority;

  @IsEnum(LeadSource)
  source: LeadSource;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  probability?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  potentialValue?: number;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  notes?: string;
}
