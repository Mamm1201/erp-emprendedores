import {
  IsDateString,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateServiceRecordDto {
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  findings?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  activitiesPerformed?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  recommendations?: string;

  @IsOptional()
  @IsDateString()
  clientSignedAt?: string;
}
