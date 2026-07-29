import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

/**
 * Crea una Cuenta de Cobro desde una Preparación de Facturación CONFIRMED.
 * Camino ADITIVO — independiente del dispatcher `create` (OT/Contrato).
 */
export class CreateInvoiceFromPreparationDto {
  @IsString()
  @IsNotEmpty()
  preparationId: string;

  @IsDateString()
  dueDate: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
