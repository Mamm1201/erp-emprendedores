import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { MaintenanceFrequency } from '../../../generated/prisma/client';

export class UpdateMaintenancePlanDto {
  @IsOptional()
  @IsEnum(MaintenanceFrequency)
  frequency?: MaintenanceFrequency;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
