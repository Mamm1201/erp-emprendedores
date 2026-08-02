import { Link, useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, User } from 'lucide-react';

import { useClient } from '@/hooks/use-clients';
import { useClientFinance } from '@/hooks/use-finance';
import type { ClientFinance } from '@/lib/types';
import { formatMoney } from '@/lib/money';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function DetailSkeleton() {
  return (
    <div className="p-4 sm:p-6 space-y-6 animate-pulse">
      <div className="h-10 w-64 rounded bg-[hsl(var(--muted))]" />
      <div className="h-40 rounded-lg bg-[hsl(var(--muted))]" />
      <div className="h-32 rounded-lg bg-[hsl(var(--muted))]" />
    </div>
  );
}

// ─── Rentabilidad del cliente (T-15) ───────────────────────────────────────────
//
// PRINCIPIO RECTOR (no reabrir sin evidencia real): todos los valores
// económicos renderizados aquí provienen directamente de
// GET /finance/clients/:clientId; no se recalculan en frontend, no se mezclan
// con otros endpoints (Cartera/receivable, Pulso) y no se realizan consultas
// adicionales. Los enlaces a Cartera y a Órdenes son navegación pura, sin
// cualificador derivado de otra fuente.
//
// Alcance reducido frente al mockup congelado (deudas documentadas, NO
// implementar sin abrir tarea): "facturado 12m" → aquí es histórico (all-time,
// el DTO no acepta período); recurrencia → ausente del DTO; salud de cobro →
// enlace sin cualificador (el cualificador viviría en T-08, otro endpoint);
// estado "tensión rentable-pero-mal-pagador" → requiere cruzar con cartera, no
// implementado; estado "salvedad por contrato" → el DTO no distingue origen de
// factura (OT vs contrato); "sus OT" → enlace sin filtro por cliente
// (WorkOrdersPage no soporta ese query param; fuera de los archivos de T-15).

type ProfitabilityState = 'sin-actividad' | 'provisional' | 'margen-negativo' | 'normal';

// Estados mutuamente excluyentes: cada condición es estrictamente más angosta
// que la anterior, así que a lo sumo una rama aplica.
function profitabilityState(data: ClientFinance): ProfitabilityState {
  if (data.workOrderCount === 0) return 'sin-actividad';
  if (parseFloat(data.invoicedTotal) === 0) return 'provisional';
  if (parseFloat(data.grossMargin) < 0) return 'margen-negativo';
  return 'normal';
}

function EconomySection({ clientId }: { clientId: string }) {
  const { data, isLoading, isError, refetch } = useClientFinance(clientId);

  if (isLoading) {
    return (
      <div className="rounded-lg border p-5 space-y-3">
        <h2 className="text-sm font-semibold">Rentabilidad</h2>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">Cargando…</p>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="rounded-lg border p-5 space-y-2">
        <h2 className="text-sm font-semibold">Rentabilidad</h2>
        <p className="text-sm text-[hsl(var(--destructive))]">
          No se pudo cargar la información económica.
        </p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>Reintentar</Button>
      </div>
    );
  }

  const state = profitabilityState(data);
  const margin = parseFloat(data.grossMargin);
  const isLoss = margin < 0;

  return (
    <div className="space-y-6">
      {/* Margen héroe + sustento */}
      <div className="rounded-lg border p-5 space-y-4">
        <h2 className="text-sm font-semibold">Rentabilidad</h2>

        {state === 'sin-actividad' && (
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            Sin actividad económica registrada.
          </p>
        )}

        {state === 'provisional' && (
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            {data.workOrderCount} OT registrada{data.workOrderCount !== 1 ? 's' : ''} · aún sin facturación.
          </p>
        )}

        {(state === 'margen-negativo' || state === 'normal') && (
          <>
            <div>
              <p className="text-xs text-[hsl(var(--muted-foreground))] uppercase tracking-wide">
                {isLoss ? 'Pérdida bruta' : 'Margen bruto'}
              </p>
              <p className={cn('text-3xl font-bold tabular-nums', isLoss ? 'text-alert-red' : 'text-node-teal')}>
                {isLoss ? '− ' : ''}{formatMoney(Math.abs(margin))}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm border-t pt-3">
              <div>
                <p className="text-[hsl(var(--muted-foreground))]">Facturado (histórico)</p>
                <p className="font-medium tabular-nums">{formatMoney(data.invoicedTotal)}</p>
              </div>
              <div>
                <p className="text-[hsl(var(--muted-foreground))]">Órdenes de trabajo</p>
                <p className="font-medium tabular-nums">{data.workOrderCount}</p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Salud de cobro + acciones (navegación pura, sin cualificador) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          to="/estado-cuentas"
          className="rounded-lg border p-4 text-sm font-medium hover:bg-[hsl(var(--muted)/0.3)] transition-colors"
        >
          Ver cartera →
        </Link>
        <Link
          to="/ordenes"
          className="rounded-lg border p-4 text-sm font-medium hover:bg-[hsl(var(--muted)/0.3)] transition-colors"
        >
          Ver órdenes de trabajo →
        </Link>
      </div>
    </div>
  );
}

// ─── ClientDetailPage ─────────────────────────────────────────────────────────

export function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: client, isLoading, isError, refetch } = useClient(id ?? null);

  if (isLoading) return <DetailSkeleton />;

  if (isError || !client) {
    return (
      <div className="p-6 space-y-2">
        <p className="text-[hsl(var(--destructive))]">No se pudo cargar el cliente.</p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>Reintentar</Button>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/clientes')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{client.legalName}</h1>
            {client.type === 'COMPANY' ? (
              <Badge variant="info" className="gap-1">
                <Building2 className="h-3 w-3" /> Empresa
              </Badge>
            ) : (
              <Badge variant="secondary" className="gap-1">
                <User className="h-3 w-3" /> Natural
              </Badge>
            )}
          </div>
          {client.tradeName && (
            <p className="text-sm text-[hsl(var(--muted-foreground))] mt-0.5">
              {client.tradeName}
            </p>
          )}
        </div>
      </div>

      {/* Identidad (solo lectura; la edición vive en Clientes) */}
      <div className="rounded-lg border p-5 space-y-3">
        <h2 className="text-sm font-semibold">Identidad</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-[hsl(var(--muted-foreground))]">NIT</p>
            <p className="font-mono">{client.taxId ?? '—'}</p>
          </div>
          <div>
            <p className="text-[hsl(var(--muted-foreground))]">Email</p>
            <p>{client.email ?? '—'}</p>
          </div>
          <div>
            <p className="text-[hsl(var(--muted-foreground))]">Teléfono</p>
            <p>{client.phone ?? '—'}</p>
          </div>
          {client.notes && (
            <div className="sm:col-span-2">
              <p className="text-[hsl(var(--muted-foreground))]">Notas</p>
              <p>{client.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Contenedor de economía (infraestructura T-14; contenido en T-15) */}
      <EconomySection clientId={client.id} />
    </div>
  );
}
