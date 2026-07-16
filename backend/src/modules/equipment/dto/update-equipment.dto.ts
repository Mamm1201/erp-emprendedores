import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import {
  EquipmentCriticality,
  EquipmentStatus,
  EquipmentType,
} from '../../../generated/prisma/client';

export class UpdateEquipmentDto {
  @IsOptional()
  @IsEnum(EquipmentType)
  type?: EquipmentType;

  @IsOptional()
  @IsEnum(EquipmentCriticality)
  criticality?: EquipmentCriticality;

  @IsOptional()
  @IsDateString()
  warrantyExpiresAt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  brand?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  model?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  serialNumber?: string;

  @IsOptional()
  @IsDateString()
  installDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  location?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @IsOptional()
  @IsEnum(EquipmentStatus)
  status?: EquipmentStatus;
}
