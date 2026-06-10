import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BranchesModule } from './modules/branches/branches.module';
import { ClientsModule } from './modules/clients/clients.module';
import { QuotationsModule } from './modules/quotations/quotations.module';
import { EquipmentModule } from './modules/equipment/equipment.module';
import { MaintenancePlansModule } from './modules/maintenance-plans/maintenance-plans.module';
import { ServiceRecordsModule } from './modules/service-records/service-records.module';
import { WorkOrdersModule } from './modules/work-orders/work-orders.module';
import { InvoicesModule } from './modules/invoices/invoices.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    ClientsModule,
    BranchesModule,
    QuotationsModule,
    WorkOrdersModule,
    EquipmentModule,
    MaintenancePlansModule,
    ServiceRecordsModule,
    InvoicesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
