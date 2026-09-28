import { IsEnum, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { NotAttendedReason } from '../../../generated/prisma/client';

export class MarkNotAttendedDto {
  @IsEnum(NotAttendedReason)
  reason: NotAttendedReason;

  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  note: string;
}

export class EarlyExecutionNoteDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  note: string;
}

export class CancelVisitDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  reason: string;
}
