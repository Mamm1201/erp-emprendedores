import { Type } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';

export class QueryRetentionRatesDto {
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  active?: boolean;
}
