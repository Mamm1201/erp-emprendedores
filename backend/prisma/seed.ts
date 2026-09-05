/**
 * Seed de datos de DEMOSTRACIÓN (clientes/sedes/equipos ficticios) — pensado
 * únicamente para levantar un entorno LOCAL DE DESARROLLO O PRUEBA vacío.
 *
 * NUNCA debe correr contra una base con datos reales del ERP: hace upsert de
 * clientes por `legalName` (ej. "Clínica Emmanuel") — si esa base ya tiene un
 * cliente real con ese nombre, este script reutiliza esa fila real y le
 * agrega sedes/equipos FICTICIOS que no coinciden con la operación real.
 *
 * Por eso exige dos condiciones explícitas antes de escribir nada:
 *   1. SEED_CONFIRM=RUN_ON_TEST_DB       (confirmación literal, a proposito)
 *   2. SEED_ADMIN_PASSWORD / SEED_TECH_PASSWORD  (sin defaults hardcodeados)
 *
 * Uso (contra una base de prueba/desarrollo vacía):
 *   SEED_CONFIRM=RUN_ON_TEST_DB SEED_ADMIN_PASSWORD='...' SEED_TECH_PASSWORD='...' npm run db:seed
 *
 * Ver prisma/seed-crm-catalog.ts para el seed de catálogo (ese sí es seguro
 * en cualquier entorno).
 */
import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import {
  DocumentType,
  EquipmentStatus,
  EquipmentType,
  PrismaClient,
  UserRole,
} from '../src/generated/prisma/client';

const BCRYPT_ROUNDS = 12;
const REQUIRED_CONFIRMATION = 'RUN_ON_TEST_DB';

function assertSafeToRun(): { adminPassword: string; techPassword: string } {
  if (process.env.SEED_CONFIRM !== REQUIRED_CONFIRMATION) {
    throw new Error(
      'Seed abortado: falta la confirmacion explicita. Este script solo debe ' +
        'correr contra una base de desarrollo o prueba VACIA, nunca contra ' +
        'datos reales del ERP. Si estas seguro de la base a la que apunta ' +
        `DATABASE_URL, vuelve a ejecutar con SEED_CONFIRM=${REQUIRED_CONFIRMATION}.`,
    );
  }

  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  const techPassword = process.env.SEED_TECH_PASSWORD;

  if (!adminPassword || adminPassword.length < 8) {
    throw new Error(
      'SEED_ADMIN_PASSWORD es obligatoria y debe tener al menos 8 caracteres.',
    );
  }
  if (!techPassword || techPassword.length < 8) {
    throw new Error(
      'SEED_TECH_PASSWORD es obligatoria y debe tener al menos 8 caracteres.',
    );
  }

  return { adminPassword, techPassword };
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter: new PrismaPg(pool),
});

const DOCUMENT_TYPES: DocumentType[] = [
  DocumentType.QUOTATION,
  DocumentType.WORK_ORDER,
  DocumentType.INVOICE,
  DocumentType.MAINTENANCE_CONTRACT,
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function date(iso: string): Date {
  return new Date(iso);
}

async function main(): Promise<void> {
  const { adminPassword, techPassword } = assertSafeToRun();
  const year = new Date().getFullYear();

  // ─── Usuarios ──────────────────────────────────────────────────────────────

  const adminHash = await bcrypt.hash(adminPassword, BCRYPT_ROUNDS);
  const marioHash = await bcrypt.hash(techPassword, BCRYPT_ROUNDS);

  await prisma.user.upsert({
    where: { email: 'admin@erp.local' },
    create: {
      email: 'admin@erp.local',
      name: 'Administrador del sistema',
      role: UserRole.ADMIN,
      passwordHash: adminHash,
    },
    update: {
      name: 'Administrador del sistema',
      role: UserRole.ADMIN,
      isActive: true,
      passwordHash: adminHash,
    },
  });

  await prisma.user.upsert({
    where: { email: 'mario@erp.local' },
    create: {
      email: 'mario@erp.local',
      name: 'Mario Alejandro Márquez Moreno',
      role: UserRole.TECHNICIAN,
      passwordHash: marioHash,
    },
    update: {
      name: 'Mario Alejandro Márquez Moreno',
      role: UserRole.TECHNICIAN,
      isActive: true,
      passwordHash: marioHash,
    },
  });

  // ─── Secuencias de documentos ──────────────────────────────────────────────

  for (const docType of DOCUMENT_TYPES) {
    await prisma.documentSequence.upsert({
      where: { docType_year: { docType, year } },
      create: { docType, year, lastValue: 0 },
      update: {},
    });
  }

  console.log('✓ Usuarios y secuencias OK');

  // ─── CLIENTE 1: Clínica Emmanuel ───────────────────────────────────────────

  let emmanuel = await prisma.client.findFirst({
    where: { legalName: 'Clínica Emmanuel', deletedAt: null },
    select: { id: true },
  });

  if (!emmanuel) {
    emmanuel = await prisma.client.create({
      data: {
        legalName: 'Clínica Emmanuel',
        tradeName: 'Emmanuel',
        notes: 'Primer cliente activo desde 2018. Referido de contacto personal.',
      },
      select: { id: true },
    });
  }

  // Emmanuel — sede Facatativá (principal)
  let emmFacatativa = await prisma.branch.findFirst({
    where: { clientId: emmanuel.id, name: 'Sede Facatativá', deletedAt: null },
    select: { id: true },
  });
  if (!emmFacatativa) {
    emmFacatativa = await prisma.branch.create({
      data: {
        clientId: emmanuel.id,
        name: 'Sede Facatativá',
        address: 'Km 1 vía Facatativá-Bogotá',
        city: 'Facatativá',
        department: 'Cundinamarca',
        isPrimary: true,
        notes: 'Sede principal. Mario instaló sistema completo de llamado de enfermería + códigos de alerta (2018).',
      },
      select: { id: true },
    });
  }

  // Emmanuel — sede Bogotá Norte
  let emmBogotaNorte = await prisma.branch.findFirst({
    where: { clientId: emmanuel.id, name: 'Sede Bogotá Norte', deletedAt: null },
    select: { id: true },
  });
  if (!emmBogotaNorte) {
    emmBogotaNorte = await prisma.branch.create({
      data: {
        clientId: emmanuel.id,
        name: 'Sede Bogotá Norte',
        city: 'Bogotá D.C.',
        department: 'Cundinamarca',
      },
      select: { id: true },
    });
  }

  // Emmanuel — sede Bogotá Sur
  let emmBogotaSur = await prisma.branch.findFirst({
    where: { clientId: emmanuel.id, name: 'Sede Bogotá Sur', deletedAt: null },
    select: { id: true },
  });
  if (!emmBogotaSur) {
    emmBogotaSur = await prisma.branch.create({
      data: {
        clientId: emmanuel.id,
        name: 'Sede Bogotá Sur',
        city: 'Bogotá D.C.',
        department: 'Cundinamarca',
      },
      select: { id: true },
    });
  }

  console.log('✓ Clínica Emmanuel — 3 sedes OK');

  // ─── CLIENTE 2: INDE ───────────────────────────────────────────────────────

  let inde = await prisma.client.findFirst({
    where: { legalName: 'INDE', deletedAt: null },
    select: { id: true },
  });
  if (!inde) {
    inde = await prisma.client.create({
      data: {
        legalName: 'INDE',
        notes: 'Contrato cuatrimestral — 2 sedes.',
      },
      select: { id: true },
    });
  }

  let indeSede1 = await prisma.branch.findFirst({
    where: { clientId: inde.id, name: 'Sede Principal', deletedAt: null },
    select: { id: true },
  });
  if (!indeSede1) {
    indeSede1 = await prisma.branch.create({
      data: {
        clientId: inde.id,
        name: 'Sede Principal',
        city: 'Bogotá D.C.',
        department: 'Cundinamarca',
        isPrimary: true,
      },
      select: { id: true },
    });
  }

  let indeSede2 = await prisma.branch.findFirst({
    where: { clientId: inde.id, name: 'Sede 2', deletedAt: null },
    select: { id: true },
  });
  if (!indeSede2) {
    indeSede2 = await prisma.branch.create({
      data: {
        clientId: inde.id,
        name: 'Sede 2',
        city: 'Bogotá D.C.',
        department: 'Cundinamarca',
      },
      select: { id: true },
    });
  }

  console.log('✓ INDE — 2 sedes OK');

  // ─── CLIENTE 3: Clínica Avellaneda ────────────────────────────────────────

  let avellaneda = await prisma.client.findFirst({
    where: { legalName: 'Clínica Avellaneda', deletedAt: null },
    select: { id: true },
  });
  if (!avellaneda) {
    avellaneda = await prisma.client.create({
      data: {
        legalName: 'Clínica Avellaneda',
        tradeName: 'Avellaneda',
        notes: 'Contrato cuatrimestral — 1 sede.',
      },
      select: { id: true },
    });
  }

  let avellanedaSede = await prisma.branch.findFirst({
    where: { clientId: avellaneda.id, name: 'Sede Principal', deletedAt: null },
    select: { id: true },
  });
  if (!avellanedaSede) {
    avellanedaSede = await prisma.branch.create({
      data: {
        clientId: avellaneda.id,
        name: 'Sede Principal',
        city: 'Bogotá D.C.',
        department: 'Cundinamarca',
        isPrimary: true,
      },
      select: { id: true },
    });
  }

  console.log('✓ Clínica Avellaneda — 1 sede OK');

  // ─── EQUIPOS ──────────────────────────────────────────────────────────────

  type EquipmentSeed = {
    branchId: string;
    type: EquipmentType;
    brand?: string;
    model?: string;
    location?: string;
    notes?: string;
    installDate?: string;
    status?: EquipmentStatus;
  };

  const equipmentToSeed: EquipmentSeed[] = [
    // Emmanuel — Facatativá (sede estrella — instalación completa de Mario)
    {
      branchId: emmFacatativa.id,
      type: EquipmentType.NURSE_CALL,
      brand: 'Aiphone',
      location: 'Central de enfermería — piso 1',
      notes: 'Sistema completo instalado por Mario Márquez en 2018. Incluye pulsadores en cada habitación y panel central.',
      installDate: '2018-01-01',
    },
    {
      branchId: emmFacatativa.id,
      type: EquipmentType.MEDICAL_ALERT,
      location: 'Urgencias y salas críticas',
      notes: 'Códigos de alerta instalados junto al sistema de llamado. Cubre urgencias, UCI y salas de parto.',
      installDate: '2018-01-01',
    },
    {
      branchId: emmFacatativa.id,
      type: EquipmentType.GENERATOR,
      location: 'Cuarto de máquinas — planta baja',
      notes: 'Planta eléctrica de respaldo para toda la sede.',
    },

    // Emmanuel — Bogotá Norte
    {
      branchId: emmBogotaNorte.id,
      type: EquipmentType.NURSE_CALL,
      location: 'Estación de enfermería — piso 2',
    },
    {
      branchId: emmBogotaNorte.id,
      type: EquipmentType.UPS,
      location: 'Cuarto de servidores',
      notes: 'UPS para equipos médicos críticos y sistemas de comunicación.',
    },
    {
      branchId: emmBogotaNorte.id,
      type: EquipmentType.GENERATOR,
      location: 'Cuarto de máquinas',
    },

    // Emmanuel — Bogotá Sur
    {
      branchId: emmBogotaSur.id,
      type: EquipmentType.NURSE_CALL,
      location: 'Central de enfermería',
    },
    {
      branchId: emmBogotaSur.id,
      type: EquipmentType.ELECTRICAL,
      location: 'Tablero principal',
      notes: 'Instalación eléctrica general — revisión de circuitos y protecciones.',
    },

    // INDE — Sede Principal
    {
      branchId: indeSede1.id,
      type: EquipmentType.NURSE_CALL,
      location: 'Central de enfermería',
    },
    {
      branchId: indeSede1.id,
      type: EquipmentType.GENERATOR,
      location: 'Cuarto de máquinas',
    },
    {
      branchId: indeSede1.id,
      type: EquipmentType.ELECTRICAL,
      location: 'Tablero principal',
    },

    // INDE — Sede 2
    {
      branchId: indeSede2.id,
      type: EquipmentType.NURSE_CALL,
      location: 'Central de enfermería',
    },
    {
      branchId: indeSede2.id,
      type: EquipmentType.UPS,
      location: 'Área médica',
    },

    // Avellaneda — Sede Principal
    {
      branchId: avellanedaSede.id,
      type: EquipmentType.NURSE_CALL,
      location: 'Central de enfermería',
    },
    {
      branchId: avellanedaSede.id,
      type: EquipmentType.GENERATOR,
      location: 'Cuarto de máquinas',
    },
    {
      branchId: avellanedaSede.id,
      type: EquipmentType.ELECTRICAL,
      location: 'Tablero principal',
    },
  ];

  for (const eq of equipmentToSeed) {
    const exists = await prisma.equipment.findFirst({
      where: { branchId: eq.branchId, type: eq.type, deletedAt: null },
      select: { id: true },
    });
    if (!exists) {
      await prisma.equipment.create({
        data: {
          branchId: eq.branchId,
          type: eq.type,
          brand: eq.brand ?? null,
          model: eq.model ?? null,
          location: eq.location ?? null,
          notes: eq.notes ?? null,
          installDate: eq.installDate ? date(eq.installDate) : null,
          status: eq.status ?? EquipmentStatus.ACTIVE,
        },
      });
    }
  }

  console.log('✓ Equipos OK');

  // ─── PLANES DE MANTENIMIENTO ──────────────────────────────────────────────
  // Requieren MaintenanceContract (Hito 13-B). El seed se actualizará cuando
  // se implemente el CRUD de contratos.
  console.log('');
  console.log('Seed completado:');
  console.log('  Clínica Emmanuel — 3 sedes, 8 equipos, 3 planes QUARTERLY');
  console.log('  INDE             — 2 sedes, 5 equipos, 2 planes EVERY_4_MONTHS');
  console.log('  Clínica Avellaneda — 1 sede, 3 equipos, 1 plan EVERY_4_MONTHS');
}

main()
  .catch((error: unknown) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
