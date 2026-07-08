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

  @IsEnum(MaintenanceFrequency)
  frequency: MaintenanceFrequency;

  @IsDateString()
  startDate: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
