import { Controller, Get, Query } from '@nestjs/common';
import { RetentionRatesService } from './retention-rates.service';
import { QueryRetentionRatesDto } from './dto/query-retention-rates.dto';

@Controller('retention-rates')
export class RetentionRatesController {
  constructor(private readonly retentionRatesService: RetentionRatesService) {}

  @Get()
  findAll(@Query() query: QueryRetentionRatesDto) {
    return this.retentionRatesService.findAll(query);
  }
}
