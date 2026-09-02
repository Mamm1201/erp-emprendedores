import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ContactRole, InfluenceLevel } from '../../../generated/prisma/client';

export class UpdateContactDto {
  @IsOptional()
  @IsString()
  branchId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @IsOptional()
  @IsEnum(ContactRole)
  role?: ContactRole;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  area?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  linkedinUrl?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;

  @IsOptional()
  @IsEnum(InfluenceLevel)
  influenceLevel?: InfluenceLevel;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
