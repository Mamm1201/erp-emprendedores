import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { PersonProfile, RelationshipType } from '../../../generated/prisma/client';

export class CreatePersonDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  fullName: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;

  @IsEnum(PersonProfile)
  profile: PersonProfile;

  @IsEnum(RelationshipType)
  relationshipType: RelationshipType;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
