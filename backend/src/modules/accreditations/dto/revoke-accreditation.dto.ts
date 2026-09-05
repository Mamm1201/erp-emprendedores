import { IsOptional, IsString, MaxLength } from 'class-validator';

export class RevokeAccreditationDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  revokedReason?: string;
}
