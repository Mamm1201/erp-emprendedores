import { Controller, Get, Param } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../auth/decorators/public.decorator';
import { PublicService } from './public.service';

@Public()
@Throttle({ default: { ttl: 60_000, limit: 30 } })
@Controller('public')
export class PublicController {
  constructor(private readonly publicService: PublicService) {}

  @Get('equipment/:qrCode')
  findByQrCode(@Param('qrCode') qrCode: string) {
    return this.publicService.findEquipmentByQrCode(qrCode);
  }
}
