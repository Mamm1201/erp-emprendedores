import { IsOptional, IsString, MaxLength } from 'class-validator';

export class VoidPaymentDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  voidReason?: string;
}
