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
import { QuotationItemDto } from './quotation-item.dto';

export class UpdateQuotationDto {
  @IsOptional()
  @IsString()
  branchId?: string | null;

  @IsOptional()
  @IsDateString()
  validUntil?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  notes?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  terms?: string;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => QuotationItemDto)
  items?: QuotationItemDto[];

  @IsOptional()
  @IsBoolean()
  retentionsApplied?: boolean;
}
