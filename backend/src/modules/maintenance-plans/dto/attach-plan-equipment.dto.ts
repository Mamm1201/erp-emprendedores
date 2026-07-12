import { IsNotEmpty, IsString } from 'class-validator';

export class AttachPlanEquipmentDto {
  @IsString()
  @IsNotEmpty()
  equipmentId: string;
}
