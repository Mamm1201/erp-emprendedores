import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import {
  BillingCycle,
  ContractStatus,
  ServiceHoursLevel,
} from '../../../generated/prisma/client';

export class UpdateMaintenanceContractDto {
  @IsOptional()
  @IsEnum(ContractStatus)
  status?: ContractStatus;

  @IsOptional()
  @IsEnum(BillingCycle)
  billingCycle?: BillingCycle;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  value?: number;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

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
