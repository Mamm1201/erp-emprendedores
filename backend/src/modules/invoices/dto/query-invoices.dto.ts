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

// Tramos de antigüedad (sobre dueDate). Solo aplican a cartera (ISSUED /
// PARTIALLY_PAID); el resto de estados quedan fuera al filtrar por antigüedad.
export enum InvoiceAging {
  NOT_DUE = 'NOT_DUE',
  D1_30 = 'D1_30',
  D31_60 = 'D31_60',
  D61_90 = 'D61_90',
  D90_PLUS = 'D90_PLUS',
}

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

  @IsOptional()
  @IsEnum(InvoiceAging)
  aging?: InvoiceAging;
}
