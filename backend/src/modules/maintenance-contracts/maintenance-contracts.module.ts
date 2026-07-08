import { Module } from '@nestjs/common';
import { MaintenanceContractsController } from './maintenance-contracts.controller';
import { MaintenanceContractsService } from './maintenance-contracts.service';

@Module({
  controllers: [MaintenanceContractsController],
  providers: [MaintenanceContractsService],
})
export class MaintenanceContractsModule {}
