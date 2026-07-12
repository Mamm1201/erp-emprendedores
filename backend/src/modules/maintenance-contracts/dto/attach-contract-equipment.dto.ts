import { IsNotEmpty, IsString } from 'class-validator';

export class AttachContractEquipmentDto {
  @IsString()
  @IsNotEmpty()
  equipmentId: string;
}
