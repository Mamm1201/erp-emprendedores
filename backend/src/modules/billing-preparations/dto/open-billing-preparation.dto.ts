import { IsNotEmpty, IsString } from 'class-validator';

/** Abre una preparación de facturación para una OT cerrada (1:1). */
export class OpenBillingPreparationDto {
  @IsString()
  @IsNotEmpty()
  workOrderId: string;
}
