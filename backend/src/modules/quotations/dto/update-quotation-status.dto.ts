import { QuotationStatus } from '../../../generated/prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateQuotationStatusDto {
  @IsEnum(QuotationStatus)
  status: QuotationStatus;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
