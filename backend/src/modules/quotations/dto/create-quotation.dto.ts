import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { QuotationItemDto } from './quotation-item.dto';

export class CreateQuotationDto {
  @IsString()
  @IsNotEmpty()
  clientId: string;

  @IsOptional()
  @IsString()
  branchId?: string;

  @IsOptional()
  @IsDateString()
  validUntil?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  notes?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  terms?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => QuotationItemDto)
  items: QuotationItemDto[];

  // Activación manual/opcional del dominio de Retenciones (RETE FUENTE/ICA).
  // No modifica total/taxTotal — ver QuotationRetentionLine.
  @IsOptional()
  @IsBoolean()
  retentionsApplied?: boolean;
}
