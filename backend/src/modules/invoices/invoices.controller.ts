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
  Query,
} from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { QueryInvoicesDto } from './dto/query-invoices.dto';
import { UpdateInvoiceStatusDto } from './dto/update-invoice-status.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { VoidPaymentDto } from './dto/void-payment.dto';
import { QueryPaymentsDto } from './dto/query-payments.dto';

@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Get()
  findAll(@Query() query: QueryInvoicesDto) {
    return this.invoicesService.findAll(query);
  }

  @Get('summary')
  getSummary() {
    return this.invoicesService.getSummary();
  }

  @Get('payments')
  findPayments(@Query() query: QueryPaymentsDto) {
    return this.invoicesService.findPayments(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.invoicesService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateInvoiceDto) {
    return this.invoicesService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateInvoiceDto) {
    return this.invoicesService.update(id, dto);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateInvoiceStatusDto) {
    return this.invoicesService.updateStatus(id, dto);
  }

  @Post(':id/payments')
  createPayment(@Param('id') id: string, @Body() dto: CreatePaymentDto) {
    return this.invoicesService.createPayment(id, dto);
  }

  @Patch(':id/payments/:paymentId/void')
  voidPayment(
    @Param('id') id: string,
    @Param('paymentId') paymentId: string,
    @Body() dto: VoidPaymentDto,
  ) {
    return this.invoicesService.voidPayment(id, paymentId, dto);
  }
}
