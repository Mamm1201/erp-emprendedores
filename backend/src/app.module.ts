import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BranchesModule } from './modules/branches/branches.module';
import { ClientsModule } from './modules/clients/clients.module';
import { QuotationsModule } from './modules/quotations/quotations.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    ClientsModule,
    BranchesModule,
    QuotationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
