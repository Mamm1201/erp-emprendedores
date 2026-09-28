import { BadRequestException } from '@nestjs/common';
import {
  MaintenanceFrequency,
  Prisma,
  VisitCompliance,
  VisitEquipmentOrigin,
  VisitEquipmentStatus,
} from '../../generated/prisma/client';

// Programacion preventiva por sede — Contrato funcional v1.0.
//
// Fechas: periodStart/periodEnd/firstPeriodStart son fechas calendario
// (@db.Date, medianoche UTC). occurredAt es un instante; para compararlo con
// el periodo se usa su fecha local de Colombia (UTC-5 fijo, sin horario de
// verano). La ejecucion real NUNCA desplaza el ciclo.

const BUSINESS_UTC_OFFSET_HOURS = -5;

export const FREQUENCY_STEP_MONTHS: Record<MaintenanceFrequency, number> = {
  MONTHLY: 1,
  QUARTERLY: 3,
  EVERY_4_MONTHS: 4,
  BIANNUAL: 6,
  ANNUAL: 12,
};

// Dias antes de periodEnd en que la visita pasa a "Por vencer" (octubre: 25).
export const DUE_SOON_DAYS = 7;

/** Fecha calendario (medianoche UTC) de un instante, en hora de Colombia. */
export function businessDate(instant: Date): Date {
  const local = new Date(
    instant.getTime() + BUSINESS_UTC_OFFSET_HOURS * 3600_000,
  );
  return new Date(
    Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()),
  );
}

/** Instante de las 00:00 de Colombia para una fecha 'YYYY-MM-DD'. */
export function businessMidnight(isoDate: string): Date {
  const [y, m, d] = isoDate.slice(0, 10).split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d, -BUSINESS_UTC_OFFSET_HOURS));
}

export function monthStart(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

export function addMonths(date: Date, months: number): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1),
  );
}

export function periodEndOf(periodStart: Date): Date {
  return new Date(
    Date.UTC(periodStart.getUTCFullYear(), periodStart.getUTCMonth() + 1, 0),
  );
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 86_400_000);
}

/**
 * Periodos del plan (seccion 5): firstPeriodStart + k * paso, dentro de los
 * meses del contrato [mes de inicio, mes de fin) y con periodEnd >= notBefore.
 */
export function planPeriods(params: {
  firstPeriodStart: Date;
  frequency: MaintenanceFrequency;
  contractStart: Date;
  contractEnd: Date;
  notBefore: Date;
}): Date[] {
  const step = FREQUENCY_STEP_MONTHS[params.frequency];
  const fromMonth = monthStart(params.contractStart);
  const toMonth = monthStart(params.contractEnd); // excluido
  const notBefore = businessDate(params.notBefore);
  const periods: Date[] = [];

  for (
    let p = monthStart(params.firstPeriodStart);
    p < toMonth;
    p = addMonths(p, step)
  ) {
    if (p >= fromMonth && periodEndOf(p) >= notBefore) periods.push(p);
  }
  return periods;
}

// ─── Plazo (4.3) — derivado, nunca se guarda ─────────────────────────────────

export type VisitDeadline =
  | 'EXECUTED_PENDING_CLOSE'
  | 'OVERDUE'
  | 'DUE_SOON'
  | 'PENDING';

type ReconcilableItem = {
  origin: VisitEquipmentOrigin;
  status: VisitEquipmentStatus;
  earlyExecutionNote: string | null;
  intervention: { occurredAt: Date } | null;
};

type ReconcilableVisit = {
  periodStart: Date;
  periodEnd: Date;
  equipment: ReconcilableItem[];
};

function scheduledItems(visit: ReconcilableVisit) {
  return visit.equipment.filter(
    (i) => i.origin === VisitEquipmentOrigin.SCHEDULED,
  );
}

function allScheduledAttendedInWindow(visit: ReconcilableVisit): boolean {
  const scheduled = scheduledItems(visit);
  return (
    scheduled.length > 0 &&
    scheduled.every(
      (i) =>
        i.status === VisitEquipmentStatus.ATTENDED &&
        i.intervention !== null &&
        businessDate(i.intervention.occurredAt) <= visit.periodEnd,
    )
  );
}

/** Etiqueta de plazo de una visita abierta (gana la primera que se cumpla). */
export function visitDeadline(
  visit: ReconcilableVisit,
  now: Date = new Date(),
): VisitDeadline {
  const today = businessDate(now);
  if (allScheduledAttendedInWindow(visit)) return 'EXECUTED_PENDING_CLOSE';
  if (today > visit.periodEnd) return 'OVERDUE';
  if (today >= addDays(visit.periodEnd, -(DUE_SOON_DAYS - 1)))
    return 'DUE_SOON';
  return 'PENDING';
}

// ─── Cierre (R7, R9, R11) ─────────────────────────────────────────────────────

/**
 * Valida que la visita pueda cerrarse y devuelve su cumplimiento (R9).
 * R11: ningun equipo PENDING. R7: cada programado anticipado con nota.
 */
export function reconcileForClose(visit: ReconcilableVisit): VisitCompliance {
  const scheduled = scheduledItems(visit);
  if (scheduled.length === 0) {
    throw new BadRequestException(
      'La visita no tiene equipos programados para conciliar.',
    );
  }

  const pending = visit.equipment.filter(
    (i) => i.status === VisitEquipmentStatus.PENDING,
  );
  if (pending.length > 0) {
    throw new BadRequestException(
      `No se puede cerrar la visita: ${pending.length} equipo(s) siguen pendientes. Registra su intervención o márcalos como no atendidos con motivo.`,
    );
  }

  const earlyWithoutNote = scheduled.filter(
    (i) =>
      i.status === VisitEquipmentStatus.ATTENDED &&
      i.intervention !== null &&
      businessDate(i.intervention.occurredAt) < visit.periodStart &&
      !i.earlyExecutionNote?.trim(),
  );
  if (earlyWithoutNote.length > 0) {
    throw new BadRequestException(
      `No se puede cerrar la visita: ${earlyWithoutNote.length} equipo(s) atendidos antes del período requieren justificación de ejecución anticipada.`,
    );
  }

  return allScheduledAttendedInWindow(visit)
    ? VisitCompliance.FULFILLED
    : VisitCompliance.NOT_FULFILLED;
}

export const RECONCILE_VISIT_SELECT = {
  id: true,
  status: true,
  periodStart: true,
  periodEnd: true,
  equipment: {
    select: {
      origin: true,
      status: true,
      earlyExecutionNote: true,
      intervention: { select: { occurredAt: true } },
    },
  },
} satisfies Prisma.MaintenanceVisitSelect;

// ─── Enlace intervencion <-> equipo de la visita (R5, R6, R7) ────────────────

/**
 * Liga una intervencion COMPLETED recien creada a la visita de su OT, si la
 * OT pertenece a una visita. Programado PENDING -> ATTENDED; equipo no
 * programado -> elemento ADDED/ATTENDED (no afecta el cumplimiento).
 */
export async function linkInterventionToVisit(
  tx: Prisma.TransactionClient,
  params: {
    workOrderId: string;
    interventionId: string;
    equipmentId: string;
    occurredAt: Date;
    earlyExecutionNote?: string | null;
  },
): Promise<void> {
  const visit = await tx.maintenanceVisit.findUnique({
    where: { workOrderId: params.workOrderId },
    select: { id: true, status: true, periodStart: true },
  });
  if (!visit) return;

  if (visit.status !== 'IN_PROGRESS') {
    throw new BadRequestException(
      `La visita de esta OT no está en ejecución (estado: ${visit.status}).`,
    );
  }

  const item = await tx.maintenanceVisitEquipment.findUnique({
    where: {
      visitId_equipmentId: {
        visitId: visit.id,
        equipmentId: params.equipmentId,
      },
    },
    select: { id: true, origin: true, status: true },
  });

  const note = params.earlyExecutionNote?.trim() || null;

  if (!item) {
    await tx.maintenanceVisitEquipment.create({
      data: {
        visitId: visit.id,
        equipmentId: params.equipmentId,
        origin: VisitEquipmentOrigin.ADDED,
        status: VisitEquipmentStatus.ATTENDED,
        interventionId: params.interventionId,
      },
    });
    return;
  }

  if (item.status !== VisitEquipmentStatus.PENDING) {
    throw new BadRequestException(
      item.status === VisitEquipmentStatus.ATTENDED
        ? 'Este equipo ya tiene una intervención registrada en esta visita.'
        : 'Este equipo está marcado como no atendido. Reviértelo a pendiente antes de registrar su intervención.',
    );
  }

  const isEarly = businessDate(params.occurredAt) < visit.periodStart;
  if (item.origin === VisitEquipmentOrigin.SCHEDULED && isEarly && !note) {
    throw new BadRequestException(
      'El equipo se atendió antes del período de la visita: se requiere justificación de ejecución anticipada.',
    );
  }

  await tx.maintenanceVisitEquipment.update({
    where: { id: item.id },
    data: {
      status: VisitEquipmentStatus.ATTENDED,
      interventionId: params.interventionId,
      earlyExecutionNote:
        item.origin === VisitEquipmentOrigin.SCHEDULED && isEarly ? note : null,
    },
  });
}

/**
 * Deshace el enlace de una intervencion anulada: el programado vuelve a
 * PENDING; el elemento ADDED (creado por esa intervencion) desaparece.
 */
export async function unlinkInterventionFromVisit(
  tx: Prisma.TransactionClient,
  interventionId: string,
): Promise<void> {
  const item = await tx.maintenanceVisitEquipment.findUnique({
    where: { interventionId },
    select: { id: true, origin: true },
  });
  if (!item) return;

  if (item.origin === VisitEquipmentOrigin.ADDED) {
    await tx.maintenanceVisitEquipment.delete({ where: { id: item.id } });
    return;
  }

  await tx.maintenanceVisitEquipment.update({
    where: { id: item.id },
    data: {
      status: VisitEquipmentStatus.PENDING,
      interventionId: null,
      earlyExecutionNote: null,
    },
  });
}
