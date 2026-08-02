import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, User } from 'lucide-react';

import { useClient } from '@/hooks/use-clients';
import { useClientFinance } from '@/hooks/use-finance';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

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

// ─── Contenedor de economía (shell únicamente · sin métricas de T-15) ─────────
// Carga desde GET /finance/clients/:clientId (T-07) para validar el contrato,
// pero solo expone estados genéricos. La vista de rentabilidad (montos,
// márgenes, indicadores) pertenece a T-15 y no se implementa aquí.

function EconomySection({ clientId }: { clientId: string }) {
  const { data, isLoading, isError, refetch } = useClientFinance(clientId);

  return (
    <div className="rounded-lg border p-5 space-y-3">
      <h2 className="text-sm font-semibold">Economía</h2>

      {isLoading && (
        <p className="text-sm text-[hsl(var(--muted-foreground))]">Cargando…</p>
      )}

      {isError && (
        <div className="space-y-2">
          <p className="text-sm text-[hsl(var(--destructive))]">
            No se pudo cargar la información económica.
          </p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>Reintentar</Button>
        </div>
      )}

      {!isLoading && !isError && data && data.workOrderCount === 0 && (
        <p className="text-sm text-[hsl(var(--muted-foreground))]">
          Sin actividad económica registrada.
        </p>
      )}

      {!isLoading && !isError && data && data.workOrderCount > 0 && (
        <p className="text-sm text-[hsl(var(--muted-foreground))]">
          Actividad registrada. Vista de rentabilidad disponible próximamente.
        </p>
      )}
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
