/**
 * Siembra el catálogo Service del CRM de Prospección (Fase 1.2).
 *
 * Inserta los 3 bloques de servicio ya aprobados en el Contrato de Diseño
 * Fase 0 — texto tomado literalmente de mi-web/docs/servicios-page-content-
 * proposal-v1.3.md (posicionamiento vigente y cerrado). Deliberadamente
 * separado de prisma/seed.ts: ese script inserta datos reales de negocio y
 * nunca debe correr contra producción; este es solo catálogo/configuración,
 * seguro de ejecutar en cualquier entorno.
 *
 * Idempotente: upsert por `name` (único) — correr varias veces no duplica.
 *
 * Uso:
 *   npm run seed:crm-catalog
 */
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { PrismaClient } from '../src/generated/prisma/client';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const SERVICES = [
  {
    name: 'Sistemas críticos y su infraestructura de soporte',
    description:
      'Llamado de enfermería, notificación de emergencias, e infraestructura de baja tensión asociada — incluyendo plantas eléctricas y UPS de respaldo. Diseño, instalación, mantenimiento preventivo y correctivo, y diagnóstico técnico.',
  },
  {
    name: 'Mobiliario y equipamiento técnico hospitalario',
    description:
      'Mantenimiento, reparación y recuperación de mobiliario hospitalario — camas eléctricas y manuales, camillas — y de sus componentes mecánicos y electromecánicos asociados.',
  },
  {
    name: 'Servicios especializados bajo proyecto',
    description:
      'STECH NODES gestiona el proyecto de principio a fin y responde por la continuidad, documentación e historial del activo. Cuando la intervención exige una competencia biomédica específica — en monitores, bombas de infusión, desfibriladores u otros equipos médicos — incorporamos al profesional biomédico idóneo para el equipo y la intervención.',
  },
];

async function main(): Promise<void> {
  for (const service of SERVICES) {
    const existing = await prisma.service.findUnique({
      where: { name: service.name },
      select: { id: true },
    });

    const result = existing
      ? await prisma.service.update({
          where: { name: service.name },
          data: { description: service.description },
        })
      : await prisma.service.create({
          data: { name: service.name, description: service.description },
        });

    console.log(`✓ ${existing ? 'actualizado' : 'creado'}: ${result.name}`);
  }
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
