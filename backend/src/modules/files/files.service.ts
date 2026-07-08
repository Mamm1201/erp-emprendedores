import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { IStorageService, STORAGE_SERVICE } from './storage/storage.interface';
import { UploadFileDto } from './dto/upload-file.dto';
import { FileEntityType } from '../../generated/prisma/client';
import * as path from 'path';
import * as crypto from 'crypto';

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'application/pdf',
]);

const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

@Injectable()
export class FilesService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(STORAGE_SERVICE) private readonly storage: IStorageService,
  ) {}

  // URL del endpoint autenticado de descarga. Para cloud storage (R2/S3),
  // el provider devuelve una pre-signed URL directamente vía storage.getUrl().
  private fileUrl(id: string): string {
    const base = process.env.STORAGE_BASE_URL ?? 'http://localhost:3000';
    return `${base}/files/${id}/download`;
  }

  async upload(
    file: Express.Multer.File,
    dto: UploadFileDto,
    uploadedById: string,
  ) {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      throw new BadRequestException(
        `Tipo de archivo no permitido: ${file.mimetype}`,
      );
    }
    if (file.size > MAX_SIZE_BYTES) {
      throw new BadRequestException('El archivo supera el límite de 10 MB');
    }

    await this.validateEntityExists(dto.entityType, dto.entityId);

    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${crypto.randomUUID()}${ext}`;
    const subfolder = dto.entityType.toLowerCase().replace('_', '-');

    const storagePath = await this.storage.save(
      file.buffer,
      uniqueName,
      subfolder,
    );

    const attachment = await this.prisma.fileAttachment.create({
      data: {
        entityType: dto.entityType,
        entityId: dto.entityId,
        category: dto.category,
        originalName: file.originalname,
        storagePath,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        description: dto.description,
        takenAt: dto.takenAt ? new Date(dto.takenAt) : undefined,
        uploadedById,
      },
      include: { uploadedBy: { select: { id: true, name: true } } },
    });

    return { ...attachment, url: this.fileUrl(attachment.id) };
  }

  async findByEntity(entityType: FileEntityType, entityId: string) {
    const attachments = await this.prisma.fileAttachment.findMany({
      where: { entityType, entityId },
      include: { uploadedBy: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return attachments.map((a) => ({ ...a, url: this.fileUrl(a.id) }));
  }

  async getFileForDownload(id: string): Promise<{ storagePath: string; mimeType: string; originalName: string }> {
    const attachment = await this.prisma.fileAttachment.findUnique({
      where: { id },
      select: { storagePath: true, mimeType: true, originalName: true },
    });
    if (!attachment) throw new NotFoundException('Archivo no encontrado');
    return attachment;
  }

  async delete(id: string) {
    const attachment = await this.prisma.fileAttachment.findUnique({
      where: { id },
    });
    if (!attachment) throw new NotFoundException('Archivo no encontrado');

    await this.storage.delete(attachment.storagePath);
    await this.prisma.fileAttachment.delete({ where: { id } });
  }

  private async validateEntityExists(
    entityType: FileEntityType,
    entityId: string,
  ) {
    let exists = false;
    switch (entityType) {
      case FileEntityType.EQUIPMENT:
        exists = !!(await this.prisma.equipment.findFirst({
          where: { id: entityId, deletedAt: null },
          select: { id: true },
        }));
        break;
      case FileEntityType.WORK_ORDER:
        exists = !!(await this.prisma.workOrder.findFirst({
          where: { id: entityId, deletedAt: null },
          select: { id: true },
        }));
        break;
      case FileEntityType.SERVICE_RECORD:
        exists = !!(await this.prisma.serviceRecord.findFirst({
          where: { id: entityId },
          select: { id: true },
        }));
        break;
      case FileEntityType.CLIENT:
        exists = !!(await this.prisma.client.findFirst({
          where: { id: entityId, deletedAt: null },
          select: { id: true },
        }));
        break;
      case FileEntityType.QUOTATION:
        exists = !!(await this.prisma.quotation.findFirst({
          where: { id: entityId, deletedAt: null },
          select: { id: true },
        }));
        break;
      case FileEntityType.INVOICE:
        exists = !!(await this.prisma.invoice.findFirst({
          where: { id: entityId },
          select: { id: true },
        }));
        break;
    }
    if (!exists) {
      throw new NotFoundException(
        `Entidad ${entityType} con id "${entityId}" no encontrada`,
      );
    }
  }
}
