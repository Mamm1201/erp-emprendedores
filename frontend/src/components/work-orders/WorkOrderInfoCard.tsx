import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Building2, CalendarClock, CalendarCheck, Clock3, MapPin, User, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import type { WorkOrder } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(iso: string | null): string {
  if (!iso) return '—';
  return format(parseISO(iso), "d MMM yyyy, HH:mm", { locale: es });
}

function fmtDate(iso: string | null): string {
  if (!iso) return '—';
  return format(parseISO(iso), "d MMM yyyy", { locale: es });
}

// ─── Sub-component ────────────────────────────────────────────────────────────

function InfoRow({
  icon: Icon,
  label,
  value,
  mono = false,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="h-4 w-4 mt-0.5 shrink-0 text-[hsl(var(--muted-foreground))]" />
      <div className="min-w-0">
        <p className="text-xs text-[hsl(var(--muted-foreground))]">{label}</p>
        <p className={`text-sm font-medium mt-0.5 ${mono ? 'font-mono' : ''}`}>{value}</p>
      </div>
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface WorkOrderInfoCardProps {
  workOrder: WorkOrder;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function WorkOrderInfoCard({ workOrder }: WorkOrderInfoCardProps) {
  const navigate = useNavigate();
  const {
    description,
    scheduledAt,
    startedAt,
    completedAt,
    branch,
    quotation,
    createdAt,
  } = workOrder;

  const clientName = workOrder.client.tradeName ?? workOrder.client.legalName;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold uppercase tracking-wide text-[hsl(var(--muted-foreground))]">
          Información general
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* Description */}
        {description && (
          <p className="text-sm text-[hsl(var(--foreground)/0.8)] leading-relaxed">
            {description}
          </p>
        )}

        {/* Two-column grid on md+ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          <InfoRow
            icon={Building2}
            label="Cliente"
            value={clientName}
          />

          <InfoRow
            icon={MapPin}
            label="Sede"
            value={
              branch
                ? `${branch.name}${branch.city ? ` · ${branch.city}` : ''}`
                : '—'
            }
          />

          <InfoRow
            icon={CalendarClock}
            label="Fecha programada"
            value={fmtDate(scheduledAt)}
          />

          <InfoRow
            icon={Clock3}
            label="Fecha de inicio"
            value={fmt(startedAt)}
          />

          <InfoRow
            icon={CalendarCheck}
            label="Fecha de cierre"
            value={fmt(completedAt)}
          />

          <InfoRow
            icon={User}
            label="Técnico asignado"
            value={workOrder.assignedTo?.name ?? 'Sin asignar'}
          />

          {quotation && (
            <div className="space-y-0.5">
              <p className="text-xs text-[hsl(var(--muted-foreground))]">Cotización origen</p>
              <div className="flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-[hsl(var(--muted-foreground))] shrink-0" />
                <button
                  className="font-mono text-sm text-[hsl(var(--primary))] hover:underline"
                  onClick={() => navigate(`/cotizaciones`)}
                  title={`Ir a cotizaciones y buscar ${quotation.number}`}
                >
                  {quotation.number}
                </button>
              </div>
            </div>
          )}

          <InfoRow
            icon={CalendarClock}
            label="Creada el"
            value={fmt(createdAt)}
          />
        </div>
      </CardContent>
    </Card>
  );
}
