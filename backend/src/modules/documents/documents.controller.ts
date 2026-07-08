import { Controller, Get, Param, Res } from '@nestjs/common';
import { Response } from 'express';
import { DocumentsService } from './documents.service';

@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get('quotations/:id/pdf')
  async quotationPdf(@Param('id') id: string, @Res() res: Response) {
    const { buffer, number } = await this.documentsService.generateQuotationPdf(id);
    const filename = `cotizacion-${number}.pdf`;

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${filename}"`,
      'Content-Length': buffer.length,
    });

    res.send(buffer);
  }

  @Get('invoices/:id/pdf')
  async invoicePdf(@Param('id') id: string, @Res() res: Response) {
    const { buffer, number } = await this.documentsService.generateInvoicePdf(id);
    const filename = `cuenta-cobro-${number}.pdf`;

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${filename}"`,
      'Content-Length': buffer.length,
    });

    res.send(buffer);
  }

  @Get('work-orders/:workOrderId/service-record/pdf')
  async serviceRecordPdf(@Param('workOrderId') workOrderId: string, @Res() res: Response) {
    const { buffer, number } = await this.documentsService.generateServiceRecordPdf(workOrderId);
    const filename = `acta-tecnica-${number}.pdf`;

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${filename}"`,
      'Content-Length': buffer.length,
    });

    res.send(buffer);
  }
}
