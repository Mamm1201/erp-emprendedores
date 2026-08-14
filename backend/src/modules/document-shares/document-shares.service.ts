import {
  GoneException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { DocumentsService } from '../documents/documents.service';
import { IStorageService, STORAGE_SERVICE } from '../files/storage/storage.interface';
import { DocumentShareType } from '../../generated/prisma/client';
import { CreateDocumentShareDto } from './dto/create-document-share.dto';
import { DocumentShareResponseDto } from './dto/document-share-response.dto';
import {
  DOCUMENT_SHARE_EXPIRATION_DAYS,
  DOCUMENT_SHARE_LABEL,
  DOCUMENT_SHARE_TOKEN_BYTES,
} from './document-shares.constants';

// Mismo origen que ya usa FilesService.fileUrl() para las URLs de descarga de
// archivos — el enlace publico apunta al backend, no a un frontend.
const PUBLIC_BASE_URL = (): string =>
  process.env.STORAGE_BASE_URL ?? 'http://localhost:3000';

interface Contact {
  email: string | null;
  phone: string | null;
}

interface ResolvedDocument {
  buffer: Buffer;
  sourceId: string;
  sourceNumber: string;
  contact: Contact;
  expiresAt: Date;
}

function pickContact(entity: {
  client?: { email: string | null; phone: string | null } | null;
  branch?: { email: string | null; contactPhone: string | null } | null;
}): Contact {
  return {
    email: entity.branch?.email ?? entity.client?.email ?? null,
    phone: entity.branch?.contactPhone ?? entity.client?.phone ?? null,
  };
}

function addDays(base: Date, days: number): Date {
  const result = new Date(base);
  result.setDate(result.getDate() + days);
  return result;
}

@Injectable()
export class DocumentSharesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly documentsService: DocumentsService,
    @Inject(STORAGE_SERVICE) private readonly storage: IStorageService,
  ) {}

  async create(dto: CreateDocumentShareDto, userId: string): Promise<DocumentShareResponseDto> {
    const resolved = await this.resolveDocument(dto.type, dto.documentId);

    const token = randomBytes(DOCUMENT_SHARE_TOKEN_BYTES).toString('base64url');
    const subfolder = `documents/shares/${dto.type.toLowerCase().replace('_', '-')}`;
    const storagePath = await this.storage.save(resolved.buffer, `${token}.pdf`, subfolder);

    try {
      const share = await this.prisma.documentShare.create({
        data: {
          token,
          type: dto.type,
          sourceId: resolved.sourceId,
          sourceNumber: resolved.sourceNumber,
          storagePath,
          sizeBytes: resolved.buffer.length,
          createdById: userId,
          expiresAt: resolved.expiresAt,
        },
      });

      return {
        url: `${PUBLIC_BASE_URL()}/public/documents/${token}`,
        expiresAt: share.expiresAt.toISOString(),
        contact: resolved.contact,
      };
    } catch (err) {
      // El archivo ya se escribio en storage pero el registro no se pudo crear
      // — no dejar un snapshot huerfano sin DocumentShare asociado (regla 4).
      await this.storage.delete(storagePath).catch(() => undefined);
      throw err;
    }
  }

  async resolveByToken(token: string): Promise<{ buffer: Buffer; filename: string }> {
    const share = await this.prisma.documentShare.findUnique({ where: { token } });
    if (!share) throw new NotFoundException('Enlace no encontrado');

    if (share.revokedAt || share.expiresAt.getTime() < Date.now()) {
      throw new GoneException('Este enlace ya no está disponible');
    }

    const buffer = await this.storage.read(share.storagePath);

    // Metadata de auditoria — nunca debe bloquear ni retrasar la entrega del
    // PDF (regla 5): se dispara sin esperar y se ignora si falla.
    this.prisma.documentShare
      .update({
        where: { id: share.id },
        data: { accessCount: { increment: 1 }, lastAccessedAt: new Date() },
      })
      .catch(() => undefined);

    return {
      buffer,
      filename: `${DOCUMENT_SHARE_LABEL[share.type]}-${share.sourceNumber}.pdf`,
    };
  }

  private async resolveDocument(
    type: DocumentShareType,
    documentId: string,
  ): Promise<ResolvedDocument> {
    switch (type) {
      case DocumentShareType.QUOTATION:
        return this.resolveQuotation(documentId);
      case DocumentShareType.INVOICE:
        return this.resolveInvoice(documentId);
      case DocumentShareType.SERVICE_RECORD:
        return this.resolveServiceRecord(documentId);
    }
  }

  private async resolveQuotation(id: string): Promise<ResolvedDocument> {
    const [pdf, q] = await Promise.all([
      this.documentsService.generateQuotationPdf(id),
      this.prisma.quotation.findFirst({
        where: { id, deletedAt: null },
        select: {
          validUntil: true,
          client: { select: { email: true, phone: true } },
          branch: { select: { email: true, contactPhone: true } },
        },
      }),
    ]);
    if (!q) throw new NotFoundException(`Cotización con id "${id}" no encontrada`);

    const defaultExpiry = addDays(new Date(), DOCUMENT_SHARE_EXPIRATION_DAYS.QUOTATION);
    const expiresAt = q.validUntil && q.validUntil < defaultExpiry ? q.validUntil : defaultExpiry;

    return {
      buffer: pdf.buffer,
      sourceId: id,
      sourceNumber: pdf.number,
      contact: pickContact(q),
      expiresAt,
    };
  }

  private async resolveInvoice(id: string): Promise<ResolvedDocument> {
    const [pdf, inv] = await Promise.all([
      this.documentsService.generateInvoicePdf(id),
      this.prisma.invoice.findFirst({
        where: { id },
        select: {
          client: { select: { email: true, phone: true } },
          workOrder: { select: { branch: { select: { email: true, contactPhone: true } } } },
        },
      }),
    ]);
    if (!inv) throw new NotFoundException(`Cuenta de cobro con id "${id}" no encontrada`);

    return {
      buffer: pdf.buffer,
      sourceId: id,
      sourceNumber: pdf.number,
      contact: pickContact({ client: inv.client, branch: inv.workOrder?.branch }),
      expiresAt: addDays(new Date(), DOCUMENT_SHARE_EXPIRATION_DAYS.INVOICE),
    };
  }

  private async resolveServiceRecord(workOrderId: string): Promise<ResolvedDocument> {
    const [pdf, wo] = await Promise.all([
      this.documentsService.generateServiceRecordPdf(workOrderId),
      this.prisma.workOrder.findFirst({
        where: { id: workOrderId, deletedAt: null },
        select: {
          client: { select: { email: true, phone: true } },
          branch: { select: { email: true, contactPhone: true } },
        },
      }),
    ]);
    if (!wo) throw new NotFoundException(`Orden de trabajo "${workOrderId}" no encontrada`);

    return {
      buffer: pdf.buffer,
      sourceId: workOrderId,
      sourceNumber: pdf.number,
      contact: pickContact(wo),
      expiresAt: addDays(new Date(), DOCUMENT_SHARE_EXPIRATION_DAYS.SERVICE_RECORD),
    };
  }
}
