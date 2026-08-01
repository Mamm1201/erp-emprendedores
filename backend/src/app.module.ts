import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { BranchesModule } from './modules/branches/branches.module';
import { ClientsModule } from './modules/clients/clients.module';
import { QuotationsModule } from './modules/quotations/quotations.module';
import { EquipmentModule } from './modules/equipment/equipment.module';
import { MaintenancePlansModule } from './modules/maintenance-plans/maintenance-plans.module';
import { ServiceRecordsModule } from './modules/service-records/service-records.module';
import { WorkOrdersModule } from './modules/work-orders/work-orders.module';
import { ResourceUtilizationsModule } from './modules/resource-utilizations/resource-utilizations.module';
import { BillingPreparationsModule } from './modules/billing-preparations/billing-preparations.module';
import { InvoicesModule } from './modules/invoices/invoices.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { FinanceModule } from './modules/finance/finance.module';
import { ExpensesModule } from './modules/expenses/expenses.module';
import { FilesModule } from './modules/files/files.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { MaintenanceContractsModule } from './modules/maintenance-contracts/maintenance-contracts.module';
import { MaintenanceVisitsModule } from './modules/maintenance-visits/maintenance-visits.module';
import { PublicModule } from './modules/public/public.module';
import { PrismaModule } from './prisma/prisma.module';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from './modules/auth/guards/roles.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    PrismaModule,
    AuthModule,
    UsersModule,
    ClientsModule,
    BranchesModule,
    QuotationsModule,
    WorkOrdersModule,
    ResourceUtilizationsModule,
    BillingPreparationsModule,
    EquipmentModule,
    MaintenancePlansModule,
    ServiceRecordsModule,
    InvoicesModule,
    ExpensesModule,
    DashboardModule,
    FinanceModule,
    FilesModule,
    DocumentsModule,
    MaintenanceContractsModule,
    MaintenanceVisitsModule,
    PublicModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
