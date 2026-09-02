import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
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

// Deliberadamente SIN `stage` — la etapa solo se modifica via el endpoint
// dedicado PATCH .../opportunities/:id/stage (Contrato de Diseño Fase 0).
export class UpdateOpportunityDto {
  @IsOptional()
  @IsString()
  primaryContactId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  detectedNeed?: string;

  @IsOptional()
  @IsEnum(OpportunityPriority)
  priority?: OpportunityPriority;

  @IsOptional()
  @IsEnum(LeadSource)
  source?: LeadSource;

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
