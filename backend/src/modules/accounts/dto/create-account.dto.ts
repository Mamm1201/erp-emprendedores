import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import {
  AccountStatus,
  InstitutionType,
  LeadSource,
  SizePotential,
} from '../../../generated/prisma/client';

export class CreateAccountDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  legalName: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  nit?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  city: string;

  @IsEnum(InstitutionType)
  institutionType: InstitutionType;

  @IsOptional()
  @IsEnum(SizePotential)
  sizePotential?: SizePotential;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  website?: string;

  @IsOptional()
  @IsEnum(AccountStatus)
  status?: AccountStatus;

  @IsEnum(LeadSource)
  source: LeadSource;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  notes?: string;
}
