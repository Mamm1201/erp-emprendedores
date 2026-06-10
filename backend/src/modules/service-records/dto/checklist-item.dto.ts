import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ChecklistResult } from '../../../generated/prisma/client';

export class ChecklistItemDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  description: string;

  @IsOptional()
  @IsEnum(ChecklistResult)
  result?: ChecklistResult;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

export class UpdateChecklistItemDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsEnum(ChecklistResult)
  result?: ChecklistResult;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
