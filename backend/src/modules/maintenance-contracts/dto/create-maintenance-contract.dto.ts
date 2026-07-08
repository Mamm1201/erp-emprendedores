import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { BillingCycle, ServiceHoursLevel } from '../../../generated/prisma/client';

export class CreateMaintenanceContractDto {
  @IsString()
  @IsNotEmpty()
  clientId: string;

  @IsEnum(BillingCycle)
  billingCycle: BillingCycle;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  value: number;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsOptional()
  @IsString()
  quotationId?: string;

  @IsOptional()
  @IsString()
  signedById?: string;

  @IsOptional()
  @IsDateString()
  signedAt?: string;

  @IsOptional()
  @IsBoolean()
  correctiveIncluded?: boolean;

  @IsOptional()
  @IsBoolean()
  partsIncluded?: boolean;

  @IsOptional()
  @IsBoolean()
  transportIncluded?: boolean;

  @IsOptional()
  @IsEnum(ServiceHoursLevel)
  serviceHours?: ServiceHoursLevel;

  @IsOptional()
  @IsInt()
  @Min(1)
  slaHoursCritical?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  slaHoursHigh?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  slaHoursMedium?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  slaHoursLow?: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
