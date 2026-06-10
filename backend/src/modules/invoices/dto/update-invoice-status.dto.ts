import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { InvoiceStatus } from '../../../generated/prisma/client';

export class UpdateInvoiceStatusDto {
  @IsEnum(InvoiceStatus)
  status: InvoiceStatus;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  voidReason?: string;
}
