import { IsEnum } from 'class-validator';
import { WorkOrderStatus } from '../../../generated/prisma/client';

export class UpdateWorkOrderStatusDto {
  @IsEnum(WorkOrderStatus)
  status: WorkOrderStatus;
}
