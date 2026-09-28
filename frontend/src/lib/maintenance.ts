import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import type {
  MaintenanceFrequency,
  MaintenanceVisitStatus,
  NotAttendedReason,
  VisitCompliance,
  VisitDeadline,
  VisitEquipmentStatus,
} from '@/lib/types';

// Etiquetas de la programacion preventiva por sede (contrato funcional v1.0).

type BadgeVariant = 'secondary' | 'warning' | 'success' | 'danger' | 'info';

export const FREQUENCY_LABELS: Record<MaintenanceFrequency, string> = {
  MONTHLY: 'Mensual',
  QUARTERLY: 'Trimestral',
  EVERY_4_MONTHS: 'Cuatrimestral',
  BIANNUAL: 'Semestral',
  ANNUAL: 'Anual',
};

export const VISIT_STATUS_LABELS: Record<MaintenanceVisitStatus, string> = {
  PENDING: 'Pendiente',
  IN_PROGRESS: 'En ejecución',
  CLOSED: 'Cerrada',
  CANCELLED: 'Cancelada',
};

export const VISIT_STATUS_BADGE: Record<MaintenanceVisitStatus, BadgeVariant> = {
  PENDING: 'secondary',
  IN_PROGRESS: 'info',
  CLOSED: 'success',
  CANCELLED: 'secondary',
};

// Plazo derivado de periodEnd — nunca de la fecha tentativa.
export const DEADLINE_LABELS: Record<VisitDeadline, string> = {
  PENDING: 'Pendiente',
  DUE_SOON: 'Por vencer',
  OVERDUE: 'Vencida',
  EXECUTED_PENDING_CLOSE: 'Ejecutada · cierre pendiente',
};

export const DEADLINE_BADGE: Record<VisitDeadline, BadgeVariant> = {
  PENDING: 'secondary',
  DUE_SOON: 'warning',
  OVERDUE: 'danger',
  EXECUTED_PENDING_CLOSE: 'info',
};

export const COMPLIANCE_LABELS: Record<VisitCompliance, string> = {
  FULFILLED: 'Cumplida',
  NOT_FULFILLED: 'Incumplida',
};

export const COMPLIANCE_BADGE: Record<VisitCompliance, BadgeVariant> = {
  FULFILLED: 'success',
  NOT_FULFILLED: 'danger',
};

export const VISIT_EQUIPMENT_STATUS_LABELS: Record<VisitEquipmentStatus, string> = {
  PENDING: 'Pendiente',
  ATTENDED: 'Atendido',
  NOT_ATTENDED: 'No atendido',
};

export const VISIT_EQUIPMENT_STATUS_BADGE: Record<VisitEquipmentStatus, BadgeVariant> = {
  PENDING: 'secondary',
  ATTENDED: 'success',
  NOT_ATTENDED: 'danger',
};

export const NOT_ATTENDED_REASON_LABELS: Record<NotAttendedReason, string> = {
  IN_USE: 'Equipo en uso',
  OUT_OF_SERVICE: 'Fuera de servicio',
  DECOMMISSIONED: 'Dado de baja',
  NO_ACCESS: 'Sin acceso',
  CLIENT_REQUEST: 'Solicitud del cliente',
  ATTENDED_NEXT_PERIOD: 'Atendido en período siguiente',
  OTHER: 'Otro',
};

/** "octubre 2026" a partir de un periodStart ('YYYY-MM-DD…'). */
export function periodLabel(periodStart: string): string {
  return format(parseISO(periodStart.slice(0, 10)), 'MMMM yyyy', { locale: es });
}

/** Fecha calendario 'd MMM yyyy' sin corrimiento de zona horaria. */
export function fmtCalendarDate(iso: string, pattern = "d 'de' MMM yyyy"): string {
  return format(parseISO(iso.slice(0, 10)), pattern, { locale: es });
}

/** Fecha local (Colombia) de un instante, para mostrar occurredAt. */
export function fmtInstantDate(iso: string, pattern = "d 'de' MMM yyyy"): string {
  return format(new Date(iso), pattern, { locale: es });
}

/** Hoy en formato 'YYYY-MM-DD' (hora local del navegador). */
export function todayIso(): string {
  return format(new Date(), 'yyyy-MM-dd');
}
