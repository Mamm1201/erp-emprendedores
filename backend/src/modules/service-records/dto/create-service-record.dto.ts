import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { InterventionInputDto } from './intervention.dto';

export class CreateServiceRecordDto {
  // Equipos realmente intervenidos durante la visita (selector "Equipo
  // intervenido" del formulario, repetible). Cada entrada crea una
  // Intervention — ver ServiceRecordsService.create(). Vacio/omitido
  // mantiene compatibilidad con OTs sin equipo identificado.
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InterventionInputDto)
  interventions?: InterventionInputDto[];

  @IsOptional()
  @IsDateString()
  clientSignedAt?: string;
}
