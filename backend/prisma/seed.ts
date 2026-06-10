import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import {
  DocumentType,
  EquipmentStatus,
  EquipmentType,
  MaintenanceFrequency,
  PrismaClient,
  UserRole,
} from '../src/generated/prisma/client';

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
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function date(iso: string): Date {
  return new Date(iso);
}

async function main(): Promise<void> {
  const year = new Date().getFullYear();

  // ─── Usuarios ──────────────────────────────────────────────────────────────

  await prisma.user.upsert({
    where: { email: 'admin@erp.local' },
    create: {
      email: 'admin@erp.local',
      name: 'Administrador del sistema',
      role: UserRole.ADMIN,
    },
    update: {
      name: 'Administrador del sistema',
      role: UserRole.ADMIN,
      isActive: true,
    },
  });

  await prisma.user.upsert({
    where: { email: 'mario@erp.local' },
    create: {
      email: 'mario@erp.local',
      name: 'Mario Alejandro Márquez Moreno',
      role: UserRole.TECHNICIAN,
    },
    update: {
      name: 'Mario Alejandro Márquez Moreno',
      role: UserRole.TECHNICIAN,
      isActive: true,
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

  type PlanSeed = {
    clientId: string;
    branchId: string;
    frequency: MaintenanceFrequency;
    contractStartDate: string;
    nextVisitDate: string;
    notes?: string;
  };

  const plansToSeed: PlanSeed[] = [
    // Emmanuel — TRIMESTRAL (4x/año)
    {
      clientId: emmanuel.id,
      branchId: emmFacatativa.id,
      frequency: MaintenanceFrequency.QUARTERLY,
      contractStartDate: '2022-01-01',
      nextVisitDate: '2026-07-10',
      notes: 'Sede principal. Incluye revisión sistema llamado enfermería + códigos alerta + planta eléctrica.',
    },
    {
      clientId: emmanuel.id,
      branchId: emmBogotaNorte.id,
      frequency: MaintenanceFrequency.QUARTERLY,
      contractStartDate: '2022-01-01',
      nextVisitDate: '2026-07-15',
    },
    {
      clientId: emmanuel.id,
      branchId: emmBogotaSur.id,
      frequency: MaintenanceFrequency.QUARTERLY,
      contractStartDate: '2022-01-01',
      nextVisitDate: '2026-07-20',
    },

    // INDE — CUATRIMESTRAL (3x/año)
    {
      clientId: inde.id,
      branchId: indeSede1.id,
      frequency: MaintenanceFrequency.EVERY_4_MONTHS,
      contractStartDate: '2022-01-01',
      nextVisitDate: '2026-08-05',
    },
    {
      clientId: inde.id,
      branchId: indeSede2.id,
      frequency: MaintenanceFrequency.EVERY_4_MONTHS,
      contractStartDate: '2022-01-01',
      nextVisitDate: '2026-08-10',
    },

    // Avellaneda — CUATRIMESTRAL (3x/año)
    {
      clientId: avellaneda.id,
      branchId: avellanedaSede.id,
      frequency: MaintenanceFrequency.EVERY_4_MONTHS,
      contractStartDate: '2022-01-01',
      nextVisitDate: '2026-09-05',
    },
  ];

  for (const plan of plansToSeed) {
    const exists = await prisma.maintenancePlan.findFirst({
      where: { clientId: plan.clientId, branchId: plan.branchId, isActive: true },
      select: { id: true },
    });
    if (!exists) {
      await prisma.maintenancePlan.create({
        data: {
          clientId: plan.clientId,
          branchId: plan.branchId,
          frequency: plan.frequency,
          contractStartDate: date(plan.contractStartDate),
          nextVisitDate: date(plan.nextVisitDate),
          isActive: true,
          notes: plan.notes ?? null,
        },
      });
    }
  }

  console.log('✓ Planes de mantenimiento OK');
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
