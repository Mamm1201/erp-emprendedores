import { IsDateString, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class ReissueAccreditationDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  displayRole: string;

  @IsOptional()
  @IsDateString()
  validFrom?: string;

  @IsOptional()
  @IsDateString()
  validUntil?: string;

  // Motivo de revocacion de la acreditacion anterior (ej. "carnet extraviado").
  @IsOptional()
  @IsString()
  @MaxLength(500)
  previousRevokedReason?: string;
}
