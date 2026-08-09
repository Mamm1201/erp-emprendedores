import { Module } from '@nestjs/common';
import { RetentionRatesModule } from '../retention-rates/retention-rates.module';
import { QuotationsController } from './quotations.controller';
import { QuotationsService } from './quotations.service';

@Module({
  imports: [RetentionRatesModule],
  controllers: [QuotationsController],
  providers: [QuotationsService],
  exports: [QuotationsService],
})
export class QuotationsModule {}
