import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SERVICE_SELECT } from './services.constants';

@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaService) {}

  // Catalogo de solo lectura — sin CRUD, sin filtros, sin paginacion
  // (Contrato de Diseño Fase 0 / alcance aprobado F1.7). Solo servicios
  // activos, mismo criterio que un catalogo comercial vigente.
  async findAll() {
    return this.prisma.service.findMany({
      where: { isActive: true },
      select: SERVICE_SELECT,
      orderBy: { name: 'asc' },
    });
  }
}
