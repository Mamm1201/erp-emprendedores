import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { BillingResolution } from '../../../generated/prisma/client';

/**
 * Fija la resolución económica de un elemento ejecutado (Utilización) dentro de
 * una preparación. En esta fase toda resolución es discrecional (source = DISCRETIONARY);
 * la clasificación reglada (RULE) llega cuando exista el motor de disposiciones de Comercial.
 */
export class SetLineResolutionDto {
  @IsString()
  @IsNotEmpty()
  utilizationId: string;

  @IsEnum(BillingResolution)
  resolution: BillingResolution;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @IsPositive()
  @Type(() => Number)
  billableQuantity?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  unitPrice?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  discountAmount?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  taxRate?: number;
}
