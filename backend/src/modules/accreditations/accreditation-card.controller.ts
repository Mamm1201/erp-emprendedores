import { Controller, Get, Param, Res } from '@nestjs/common';
import { Response } from 'express';
import { UserRole } from '../../generated/prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { DocumentsService } from '../documents/documents.service';

// Ruta plana `/accreditations/:id/card.pdf` (no anidada bajo /persons/:personId)
// — Accreditation.id es único globalmente, y así queda tal como se aprobó en
// el contrato de este pendiente de Fase 4.
@Controller('accreditations')
@Roles(UserRole.ADMIN)
export class AccreditationCardController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get(':id/card.pdf')
  async card(@Param('id') id: string, @Res() res: Response) {
    const { buffer } = await this.documentsService.generateAccreditationCardPdf(id);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="acreditacion-${id}.pdf"`,
      'Content-Length': buffer.length,
    });

    res.send(buffer);
  }
}
