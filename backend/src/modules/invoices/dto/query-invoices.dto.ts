import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { InvoiceStatus } from '../../../generated/prisma/client';
import {
  INVOICE_DEFAULT_LIMIT,
  INVOICE_DEFAULT_PAGE,
  INVOICE_MAX_LIMIT,
} from '../invoices.constants';

export class QueryInvoicesDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = INVOICE_DEFAULT_PAGE;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(INVOICE_MAX_LIMIT)
  limit: number = INVOICE_DEFAULT_LIMIT;

  @IsOptional()
  @IsString()
  clientId?: string;

  @IsOptional()
  @IsEnum(InvoiceStatus)
  status?: InvoiceStatus;

  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @IsOptional()
  @IsDateString()
  toDate?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  contractId?: string;
}
