import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { EquipmentStatus, EquipmentType } from '../../../generated/prisma/client';
import {
  EQUIPMENT_DEFAULT_LIMIT,
  EQUIPMENT_DEFAULT_PAGE,
  EQUIPMENT_MAX_LIMIT,
} from '../equipment.constants';

export class QueryEquipmentDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = EQUIPMENT_DEFAULT_PAGE;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(EQUIPMENT_MAX_LIMIT)
  limit: number = EQUIPMENT_DEFAULT_LIMIT;

  @IsOptional()
  @IsEnum(EquipmentType)
  type?: EquipmentType;

  @IsOptional()
  @IsEnum(EquipmentStatus)
  status?: EquipmentStatus;

  @IsOptional()
  @IsString()
  search?: string;
}
