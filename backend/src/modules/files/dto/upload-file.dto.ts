import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { FileCategory, FileEntityType } from '../../../generated/prisma/client';

export class UploadFileDto {
  @IsEnum(FileEntityType)
  entityType: FileEntityType;

  @IsString()
  entityId: string;

  @IsEnum(FileCategory)
  category: FileCategory;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsString()
  takenAt?: string;
}
