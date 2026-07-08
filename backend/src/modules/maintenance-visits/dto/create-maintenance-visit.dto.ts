import { IsDateString, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateMaintenanceVisitDto {
  @IsDateString()
  scheduledDate: string;

  @IsOptional()
  @IsDateString()
  windowEnd?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
