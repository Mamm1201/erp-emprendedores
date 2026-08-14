import { Controller, Get, Param, Res } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Response } from 'express';
import { Public } from '../auth/decorators/public.decorator';
import { DocumentSharesService } from './document-shares.service';

// Endpoint publico de solo lectura: solo entrega el PDF asociado al token.
// Sin listado, sin metadata del documento/cliente/usuario que lo compartio —
// exactamente el mismo mecanismo @Public()+@Throttle del portal QR
// (public.controller.ts), en un controller separado porque es un dominio
// distinto (documentos compartidos, no equipos).
@Public()
@Throttle({ default: { ttl: 60_000, limit: 20 } })
@Controller('public')
export class PublicDocumentsController {
  constructor(private readonly documentSharesService: DocumentSharesService) {}

  @Get('documents/:token')
  async serve(@Param('token') token: string, @Res() res: Response): Promise<void> {
    const { buffer, filename } = await this.documentSharesService.resolveByToken(token);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${filename}"`,
      'Content-Length': buffer.length,
      'X-Robots-Tag': 'noindex, nofollow',
    });
    res.send(buffer);
  }
}
