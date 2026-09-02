import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ActivityStatus, ActivityType } from '../../../generated/prisma/client';

export class CreateActivityDto {
  @IsOptional()
  @IsString()
  opportunityId?: string;

  @IsOptional()
  @IsString()
  contactId?: string;

  @IsEnum(ActivityType)
  type: ActivityType;

  @IsOptional()
  @IsEnum(ActivityStatus)
  status?: ActivityStatus;

  @IsDateString()
  occurredAt: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  summary: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  outcome?: string;

  @IsOptional()
  @IsBoolean()
  aiGenerated?: boolean;
}
