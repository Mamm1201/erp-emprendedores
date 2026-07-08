import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { UserRole } from '../../../generated/prisma/client';

export class QueryUsersDto {
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }: { value: string }) => value === 'true')
  isActive?: boolean;

  @IsOptional()
  @IsString()
  search?: string;
}
