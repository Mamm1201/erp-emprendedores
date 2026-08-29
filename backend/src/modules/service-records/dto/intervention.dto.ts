import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { ChecklistItemDto } from './checklist-item.dto';

// Un equipo realmente intervenido durante la visita — solo estos generan una
// Intervention. Equipos programados/asociados a la visita que no se
// intervinieron no deben aparecer aqui.
export class InterventionInputDto {
  @IsString()
  @IsNotEmpty()
  equipmentId: string;

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
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChecklistItemDto)
  checklistItems?: ChecklistItemDto[];

  // Tecnico que realmente ejecuto esta intervencion puntual — distinto de
  // WorkOrderTechnician (ejecutores de la OT completa).
  @IsOptional()
  @IsString()
  primaryTechnicianId?: string;
}

export class UpdateInterventionDto {
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
  @IsString()
  primaryTechnicianId?: string;
}
