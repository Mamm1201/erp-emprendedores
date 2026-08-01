import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';

// Presets de período para las lecturas analíticas de Finanzas. Conjunto mínimo:
// se amplía solo cuando un consumidor real (T-08/T-09) lo requiera.
export enum FinancePeriod {
  CURRENT_MONTH = 'CURRENT_MONTH',
  LAST_12_MONTHS = 'LAST_12_MONTHS',
  CUSTOM = 'CUSTOM',
}

// Valida únicamente la forma. La resolución período → rango de fechas pertenece
// a los endpoints que la consuman (T-08 en adelante), no a T-06.
export class FinancePeriodQueryDto {
  @IsOptional()
  @IsEnum(FinancePeriod)
  period?: FinancePeriod;

  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @IsOptional()
  @IsDateString()
  toDate?: string;

  @IsOptional()
  @IsString()
  clientId?: string;
}
