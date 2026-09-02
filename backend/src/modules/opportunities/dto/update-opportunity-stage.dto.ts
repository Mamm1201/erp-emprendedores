import { IsEnum } from 'class-validator';
import { OpportunityStage } from '../../../generated/prisma/client';

export class UpdateOpportunityStageDto {
  @IsEnum(OpportunityStage)
  stage: OpportunityStage;
}
