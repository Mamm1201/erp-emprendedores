import { Injectable, NotFoundException } from '@nestjs/common';
import { renderToBuffer } from '@react-pdf/renderer';
import React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { PrismaService } from '../../prisma/prisma.service';
import { QuotationDocument } from './templates/QuotationDocument';
import { ServiceRecordDocument } from './templates/ServiceRecordDocument';
import { InvoiceDocument } from './templates/InvoiceDocument';
import type { QuotationPdfDto } from './dto/quotation-pdf.dto';
import type { ServiceRecordPdfDto } from './dto/service-record-pdf.dto';
import type { InvoicePdfDto } from './dto/invoice-pdf.dto';

function fmtDate(d: Date | string | null | undefined): string {
  if (!d) return '—';
  try {
    return format(new Date(d), "d 'de' MMMM 'de' yyyy", { locale: es });
  } catch {
    return String(d);
  }
}

function decStr(v: unknown): string {
  return v != null ? String(v) : '0';
}

@Injectable()
export class DocumentsService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Cotización ─────────────────────────────────────────────────────────────

  async generateQuotationPdf(id: string): Promise<{ buffer: Buffer; number: string }> {
    const q = await this.prisma.quotation.findFirst({
      where: { id, deletedAt: null },
      include: {
        items: { orderBy: { lineOrder: 'asc' } },
        client: { select: { legalName: true, taxId: true } },
        branch: { select: { name: true, address: true, city: true, department: true, contactName: true, contactPhone: true } },
      },
    });

    if (!q) throw new NotFoundException(`Cotización con id "${id}" no encontrada`);

    const dto: QuotationPdfDto = {
      number: q.number,
      status: q.status,
      issueDate: fmtDate(q.issueDate),
      validUntil: q.validUntil ? fmtDate(q.validUntil) : null,

      clientLegalName: q.clientLegalName ?? q.client.legalName,
      clientTaxId: q.clientTaxId ?? q.client.taxId ?? null,

      branchName: q.branchName ?? q.branch?.name ?? null,
      branchAddress: q.branchAddress ?? q.branch?.address ?? null,
      branchCity: q.branchCity ?? q.branch?.city ?? null,
      branchDepartment: q.branchDepartment ?? q.branch?.department ?? null,
      branchContactName: q.branchContactName ?? q.branch?.contactName ?? null,
      branchContactPhone: q.branchContactPhone ?? q.branch?.contactPhone ?? null,

      items: q.items.map((item) => ({
        lineOrder: item.lineOrder,
        description: item.description,
        quantity: decStr(item.quantity),
        unitPrice: decStr(item.unitPrice),
        discountAmount: decStr(item.discountAmount),
        taxRate: decStr(item.taxRate),
        lineSubtotal: decStr(item.lineSubtotal),
        lineTotal: decStr(item.lineTotal),
      })),

      subtotal: decStr(q.subtotal),
      discountTotal: decStr(q.discountTotal),
      taxTotal: decStr(q.taxTotal),
      total: decStr(q.total),

      notes:           q.notes ?? null,
      terms:           q.terms ?? null,
      paymentTerms:    null,
      warranty:        null,
      additionalNotes: null,

      generatedAt: fmtDate(new Date()),
    };

    // renderToBuffer espera ReactElement<DocumentProps>; el cast es seguro
    // porque QuotationDocument renderiza <Document> como raíz via PageLayout.
    const element = React.createElement(QuotationDocument, { data: dto }) as any;
    const buffer = await renderToBuffer(element);
    return { buffer: Buffer.from(buffer), number: q.number };
  }

  // ─── Acta Técnica ────────────────────────────────────────────────────────────

  async generateServiceRecordPdf(workOrderId: string): Promise<{ buffer: Buffer; number: string }> {
    const wo = await this.prisma.workOrder.findFirst({
      where: { id: workOrderId, deletedAt: null },
      include: {
        client: { select: { legalName: true, taxId: true } },
        branch: { select: { name: true, address: true, city: true } },
        assignedTo: { select: { name: true } },
        technicians: {
          select: { user: { select: { name: true } } },
          orderBy: { createdAt: 'asc' },
        },
        serviceRecord: {
          include: {
            checklistItems: { orderBy: { createdAt: 'asc' } },
          },
        },
      },
    });

    if (!wo) throw new NotFoundException(`Orden de trabajo "${workOrderId}" no encontrada`);
    if (!wo.serviceRecord) throw new NotFoundException(`La OT "${wo.number}" no tiene acta técnica`);

    const sr = wo.serviceRecord;

    const dto: ServiceRecordPdfDto = {
      workOrderNumber: wo.number,
      workOrderTitle: wo.title,
      workOrderType: wo.type,
      generatedAt: fmtDate(new Date()),

      scheduledAt: wo.scheduledAt ? fmtDate(wo.scheduledAt) : null,
      startedAt: wo.startedAt ? fmtDate(wo.startedAt) : null,
      completedAt: wo.completedAt ? fmtDate(wo.completedAt) : null,
      clientSignedAt: sr.clientSignedAt ? fmtDate(sr.clientSignedAt) : null,

      clientLegalName: wo.client.legalName,
      clientTaxId: wo.client.taxId ?? null,
      branchName: wo.branch?.name ?? null,
      branchAddress: wo.branch?.address ?? null,
      branchCity: wo.branch?.city ?? null,

      technicianName: wo.assignedTo?.name ?? null,
      technicianNames: wo.technicians.map((t) => t.user.name),

      findings: sr.findings,
      activitiesPerformed: sr.activitiesPerformed,
      recommendations: sr.recommendations,

      checklistItems: sr.checklistItems.map((item) => ({
        description: item.description,
        result: item.result as 'OK' | 'WARNING' | 'FAIL' | 'NA',
        notes: item.notes,
      })),
    };

    const element = React.createElement(ServiceRecordDocument, { data: dto }) as any;
    const buffer = await renderToBuffer(element);
    return { buffer: Buffer.from(buffer), number: wo.number };
  }

  // ─── Cuenta de Cobro ─────────────────────────────────────────────────────────

  async generateInvoicePdf(id: string): Promise<{ buffer: Buffer; number: string }> {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      select: {
        number: true,
        status: true,
        issueDate: true,
        dueDate: true,
        subtotal: true,
        discountTotal: true,
        taxTotal: true,
        total: true,
        notes: true,
        client: { select: { legalName: true, taxId: true } },
        workOrder: {
          select: {
            number: true,
            branch: { select: { name: true, address: true, city: true } },
          },
        },
        items: { select: { lineOrder: true, description: true, quantity: true, unitPrice: true, discountAmount: true, taxRate: true, lineSubtotal: true, lineTotal: true }, orderBy: { lineOrder: 'asc' } },
      },
    });

    if (!invoice) throw new NotFoundException(`Cuenta de cobro "${id}" no encontrada`);

    const dto: InvoicePdfDto = {
      number: invoice.number,
      status: invoice.status,
      issueDate: fmtDate(invoice.issueDate),
      dueDate: fmtDate(invoice.dueDate),

      clientLegalName: invoice.client.legalName,
      clientTaxId: invoice.client.taxId ?? null,

      branchName: invoice.workOrder?.branch?.name ?? null,
      branchAddress: invoice.workOrder?.branch?.address ?? null,
      branchCity: invoice.workOrder?.branch?.city ?? null,

      workOrderNumber: invoice.workOrder?.number ?? null,

      items: invoice.items.map((item) => ({
        lineOrder: item.lineOrder,
        description: item.description,
        quantity: decStr(item.quantity),
        unitPrice: decStr(item.unitPrice),
        discountAmount: decStr(item.discountAmount),
        taxRate: decStr(item.taxRate),
        lineSubtotal: decStr(item.lineSubtotal),
        lineTotal: decStr(item.lineTotal),
      })),

      subtotal: decStr(invoice.subtotal),
      discountTotal: decStr(invoice.discountTotal),
      taxTotal: decStr(invoice.taxTotal),
      total: decStr(invoice.total),

      notes:        invoice.notes ?? null,
      paymentTerms: null,
      warranty:     null,
      generatedAt:  fmtDate(new Date()),
    };

    const element = React.createElement(InvoiceDocument, { data: dto }) as any;
    const buffer = await renderToBuffer(element);
    return { buffer: Buffer.from(buffer), number: invoice.number };
  }
}
