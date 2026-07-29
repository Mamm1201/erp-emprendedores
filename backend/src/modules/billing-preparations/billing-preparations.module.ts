import { Module } from '@nestjs/common';
import { BillingPreparationsController } from './billing-preparations.controller';
import { BillingPreparationsService } from './billing-preparations.service';

@Module({
  controllers: [BillingPreparationsController],
  providers: [BillingPreparationsService],
  exports: [BillingPreparationsService],
})
export class BillingPreparationsModule {}
