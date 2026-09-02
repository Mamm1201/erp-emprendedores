import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { QuotationItemDto } from '../../quotations/dto/quotation-item.dto';

// Mismo shape que CreateQuotationDto, sin clientId — se resuelve
// internamente (Account -> Client) dentro de generateQuotation().
export class GenerateQuotationDto {
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

  @IsOptional()
  @IsBoolean()
  retentionsApplied?: boolean;
}
