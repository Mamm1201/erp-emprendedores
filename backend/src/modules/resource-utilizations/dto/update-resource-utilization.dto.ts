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

/** Edición de una utilización durante la ventana editable de la OT. */
export class UpdateResourceUtilizationDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  resourceName?: string;

  @IsOptional()
  @IsEnum(ResourceCategory)
  category?: ResourceCategory;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @IsPositive()
  @Type(() => Number)
  quantity?: number;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  unit?: string;

  @IsOptional()
  @IsEnum(ResourceOrigin)
  origin?: ResourceOrigin;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  observation?: string;
}
