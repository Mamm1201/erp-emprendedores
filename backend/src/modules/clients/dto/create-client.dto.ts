import { ClientType } from '../../../generated/prisma/client';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateClientDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  legalName: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  tradeName?: string;

  /** NIT / documento de identificación (único en el sistema) */
  @IsOptional()
  @IsString()
  @MaxLength(50)
  taxId?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @IsOptional()
  @IsEnum(ClientType)
  type?: ClientType;

  // Condición de agente retenedor (dominio Retenciones). Opcional, default
  // false — nunca se asume que un cliente retiene por defecto.
  @IsOptional()
  @IsBoolean()
  isIncomeTaxRetentionAgent?: boolean;

  @IsOptional()
  @IsBoolean()
  isIcaRetentionAgent?: boolean;
}
