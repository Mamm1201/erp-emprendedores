import { Module } from '@nestjs/common';
import { MaintenanceContractsController } from './maintenance-contracts.controller';
import { MaintenanceContractsService } from './maintenance-contracts.service';
import { MaintenancePlansModule } from '../maintenance-plans/maintenance-plans.module';

@Module({
  imports: [MaintenancePlansModule],
  controllers: [MaintenanceContractsController],
  providers: [MaintenanceContractsService],
})
export class MaintenanceContractsModule {}
