import { Module } from '@nestjs/common';
import { MaintenanceVisitsController } from './maintenance-visits.controller';
import { MaintenanceVisitsService } from './maintenance-visits.service';

@Module({
  controllers: [MaintenanceVisitsController],
  providers: [MaintenanceVisitsService],
})
export class MaintenanceVisitsModule {}
