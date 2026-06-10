import { useState } from 'react';
import { format, differenceInDays, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarClock, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { useUpcomingVisits } from '@/hooks/use-upcoming-visits';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { MaintenanceFrequency } from '@/lib/types';

const DAYS_OPTIONS = [30, 60, 90] as const;

const FREQUENCY_LABELS: Record<MaintenanceFrequency, string> = {
  MONTHLY: 'Mensual',
  QUARTERLY: 'Trimestral',
  EVERY_4_MONTHS: 'Cuatrimestral',
  BIANNUAL: 'Semestral',
  ANNUAL: 'Anual',
};

function urgencyBadge(daysLeft: number) {
  if (daysLeft < 0) return <Badge variant="danger">Vencida</Badge>;
  if (daysLeft <= 7) return <Badge variant="danger">Esta semana</Badge>;
  if (daysLeft <= 14) return <Badge variant="warning">Próxima semana</Badge>;
  return <Badge variant="success">En {daysLeft} días</Badge>;
}

function StatCard({
  title,
  value,
  icon: Icon,
  description,
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  description: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-[hsl(var(--muted-foreground))]">
            {title}
          </CardTitle>
          <Icon className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">{description}</p>
      </CardContent>
    </Card>
  );
}

export function DashboardPage() {
  const [days, setDays] = useState<30 | 60 | 90>(30);
  const { data, isLoading, isError, error } = useUpcomingVisits(days);

  const today = new Date();

  const overdue = data?.data.filter((v) => differenceInDays(parseISO(v.nextVisitDate), today) < 0).length ?? 0;
  const thisWeek = data?.data.filter((v) => {
    const d = differenceInDays(parseISO(v.nextVisitDate), today);
    return d >= 0 && d <= 7;
  }).length ?? 0;
  const upcoming = data?.data.filter((v) => differenceInDays(parseISO(v.nextVisitDate), today) > 7).length ?? 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Próximas visitas</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
            Programación de mantenimiento preventivo
          </p>
        </div>
        <div className="flex gap-2">
          {DAYS_OPTIONS.map((d) => (
            <Button
              key={d}
              variant={days === d ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDays(d)}
            >
              {d} días
            </Button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard
          title="Vencidas"
          value={overdue}
          icon={AlertTriangle}
          description="Visitas sin realizar"
        />
        <StatCard
          title="Esta semana"
          value={thisWeek}
          icon={Clock}
          description="Próximos 7 días"
        />
        <StatCard
          title="Programadas"
          value={upcoming}
          icon={CheckCircle}
          description={`En los próximos ${days} días`}
        />
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarClock className="h-4 w-4" />
            Calendario de visitas
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading && (
            <div className="py-16 text-center text-sm text-[hsl(var(--muted-foreground))]">
              Cargando...
            </div>
          )}

          {isError && (
            <div className="py-16 text-center text-sm text-[hsl(var(--destructive))]">
              Error al cargar los datos: {(error as Error).message}
            </div>
          )}

          {data && data.data.length === 0 && (
            <div className="py-16 text-center text-sm text-[hsl(var(--muted-foreground))]">
              No hay visitas programadas en los próximos {days} días.
            </div>
          )}

          {data && data.data.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Sede</TableHead>
                  <TableHead>Ciudad</TableHead>
                  <TableHead>Frecuencia</TableHead>
                  <TableHead>Próxima visita</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.data.map((visit) => {
                  const daysLeft = differenceInDays(parseISO(visit.nextVisitDate), today);
                  return (
                    <TableRow key={visit.id}>
                      <TableCell className="font-medium">
                        {visit.client.tradeName ?? visit.client.legalName}
                      </TableCell>
                      <TableCell>{visit.branch?.name ?? '—'}</TableCell>
                      <TableCell className="text-[hsl(var(--muted-foreground))]">
                        {visit.branch?.city ?? '—'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {FREQUENCY_LABELS[visit.frequency]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(parseISO(visit.nextVisitDate), "d 'de' MMMM yyyy", { locale: es })}
                      </TableCell>
                      <TableCell>{urgencyBadge(daysLeft)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
