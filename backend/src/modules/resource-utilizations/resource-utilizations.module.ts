import { Module } from '@nestjs/common';
import { ResourceUtilizationsController } from './resource-utilizations.controller';
import { ResourceUtilizationsService } from './resource-utilizations.service';

@Module({
  controllers: [ResourceUtilizationsController],
  providers: [ResourceUtilizationsService],
})
export class ResourceUtilizationsModule {}
