import { IsArray, IsString } from 'class-validator';

// Reemplaza el conjunto completo de ejecutores de la OT (sin add/remove
// incremental). userIds vacío = sin ejecutores registrados (opcional, T-16).
export class UpdateWorkOrderTechniciansDto {
  @IsArray()
  @IsString({ each: true })
  technicianIds: string[];
}
