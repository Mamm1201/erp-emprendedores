import { Controller, Get, Param } from '@nestjs/common';
import { FinanceService } from './finance.service';

// Protegido por el JwtAuthGuard global (cualquier usuario autenticado), igual
// que DashboardController. Sin @Roles por ahora.
@Controller('finance')
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Get('ping')
  ping() {
    return this.financeService.ping();
  }

  @Get('clients/:clientId')
  getClientFinance(@Param('clientId') clientId: string) {
    return this.financeService.getClientFinance(clientId);
  }
}
