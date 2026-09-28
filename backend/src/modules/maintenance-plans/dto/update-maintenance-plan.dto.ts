import {
  IsBoolean,
  IsDateString,
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

  // Cambiar ancla o frecuencia regenera solo visitas futuras PENDING sin OT (C7).
  @IsOptional()
  @IsDateString()
  firstPeriodStart?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
