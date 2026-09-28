import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
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

  // Fecha real de atencion del equipo ('YYYY-MM-DD' = ese dia en Colombia, o
  // instante ISO). Por defecto, ahora. No puede ser futura.
  @IsOptional()
  @IsDateString()
  occurredAt?: string;

  // R7: obligatoria si el equipo programado se atiende antes del periodo.
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  earlyExecutionNote?: string;
}

// Agregar intervenciones a un Acta existente mientras la OT esta abierta
// (ejecucion en varias jornadas — R14).
export class AddInterventionsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => InterventionInputDto)
  interventions: InterventionInputDto[];
}

export class UpdateInterventionDto {
  @IsOptional()
  @IsDateString()
  occurredAt?: string;

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
