import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { MaintenanceFrequency } from '../../../generated/prisma/client';

export class CreateMaintenancePlanDto {
  @IsString()
  @IsNotEmpty()
  contractId: string;

  // Sede del plan (R1): todos sus equipos deben pertenecer a ella.
  @IsString()
  @IsNotEmpty()
  branchId: string;

  @IsEnum(MaintenanceFrequency)
  frequency: MaintenanceFrequency;

  // Mes ancla del ciclo; se normaliza al dia 1.
  @IsDateString()
  firstPeriodStart: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
