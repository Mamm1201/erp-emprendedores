import { Module } from '@nestjs/common';
import { RetentionRatesController } from './retention-rates.controller';
import { RetentionRatesService } from './retention-rates.service';

@Module({
  controllers: [RetentionRatesController],
  providers: [RetentionRatesService],
  exports: [RetentionRatesService],
})
export class RetentionRatesModule {}
