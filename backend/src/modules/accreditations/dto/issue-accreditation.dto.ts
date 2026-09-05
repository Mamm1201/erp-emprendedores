import { IsDateString, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class IssueAccreditationDto {
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
}
