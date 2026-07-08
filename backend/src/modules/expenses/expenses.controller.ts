import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser } from '../auth/auth.service';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';

@Controller('work-orders/:workOrderId/expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Get()
  findAll(@Param('workOrderId') workOrderId: string) {
    return this.expensesService.findAllByWorkOrder(workOrderId);
  }

  @Post()
  create(
    @Param('workOrderId') workOrderId: string,
    @Body() dto: CreateExpenseDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.expensesService.create(workOrderId, dto, user.id);
  }

  @Patch(':id')
  update(
    @Param('workOrderId') workOrderId: string,
    @Param('id') id: string,
    @Body() dto: UpdateExpenseDto,
  ) {
    return this.expensesService.update(workOrderId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(
    @Param('workOrderId') workOrderId: string,
    @Param('id') id: string,
  ) {
    return this.expensesService.remove(workOrderId, id);
  }
}
