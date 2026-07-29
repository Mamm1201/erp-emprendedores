import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  ResourceCategory,
  ResourceOrigin,
} from '../../../generated/prisma/client';

/**
 * Utilización de recurso — hecho técnico dentro de una OT (contexto Operaciones).
 * SIN economía: no acepta precio, costo, impuesto, descuento ni decisión de cobro.
 */
export class CreateResourceUtilizationDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  resourceName: string;

  @IsEnum(ResourceCategory)
  category: ResourceCategory;

  @IsNumber({ maxDecimalPlaces: 3 })
  @IsPositive()
  @Type(() => Number)
  quantity: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  unit: string;

  @IsEnum(ResourceOrigin)
  origin: ResourceOrigin;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  observation?: string;
}
