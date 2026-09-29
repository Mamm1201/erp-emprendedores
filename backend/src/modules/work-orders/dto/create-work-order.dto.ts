import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { WorkOrderType } from '../../../generated/prisma/client';
import { WorkOrderItemDto } from './work-order-item.dto';

// Naturalezas que se eligen al crear o convertir una OT. PREVENTIVE queda
// reservado a las OTs generadas por MaintenanceVisit (D-a).
export const SELECTABLE_WORK_ORDER_TYPES = [
  WorkOrderType.CORRECTIVE,
  WorkOrderType.INSPECTION,
  WorkOrderType.SUPPLY,
] as const;

export class CreateWorkOrderDto {
  @IsString()
  @IsNotEmpty()
  clientId: string;

  // Naturaleza de la OT; no editable despues de creada. Por defecto CORRECTIVE.
  @IsOptional()
  @IsIn(SELECTABLE_WORK_ORDER_TYPES, {
    message: `type debe ser uno de: ${SELECTABLE_WORK_ORDER_TYPES.join(', ')}`,
  })
  type?: (typeof SELECTABLE_WORK_ORDER_TYPES)[number];

  @IsOptional()
  @IsString()
  branchId?: string;

  @IsOptional()
  @IsString()
  quotationId?: string;

  @IsOptional()
  @IsString()
  equipmentId?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @IsOptional()
  @IsString()
  assignedToId?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkOrderItemDto)
  items?: WorkOrderItemDto[];
}
