import { IsDateString, IsOptional, IsString, MaxLength } from 'class-validator';

// El periodo (periodStart/periodEnd) es inmutable: solo se planifica la fecha
// tentativa, que puede estar fuera del periodo (C1) y no afecta el cumplimiento.
export class UpdateMaintenanceVisitDto {
  @IsOptional()
  @IsDateString()
  scheduledDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
