import { useNavigate } from 'react-router-dom';
import { FileText, Wallet } from 'lucide-react';

import { useReceivable } from '@/hooks/use-finance';
import type { ReceivableAgingBucket } from '@/lib/types';
import { formatMoney } from '@/lib/money';
import { Button } from '@/components/ui/button';

// ─── Aging bucket colors (severidad creciente) ────────────────────────────────

const AGING_BAR: Record<string, string> = {
  'No vencido': 'bg-node-teal',
  '1-30': 'bg-amber-signal',
  '31-60': 'bg-alert-red/50',
  '61-90': 'bg-alert-red/75',
  '90+': 'bg-alert-red',
};

function agingBar(bucket: string): string {
  return AGING_BAR[bucket] ?? 'bg-[hsl(var(--muted))]';
}

// ─── Cartera (hub de lo por cobrar) ───────────────────────────────────────────

export function EstadoCuentasPage() {
  const navigate = useNavigate();
  const { data: r, isLoading, isError, refetch } = useReceivable();

  if (isLoading) {
    return <div className="p-6 text-[hsl(var(--muted-foreground))]">Cargando cartera…</div>;
  }

  if (isError || !r) {
    return (
      <div className="p-6 space-y-2">
        <p className="text-[hsl(var(--destructive))]">No se pudo cargar la cartera.</p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>Reintentar</Button>
      </div>
    );
  }

  const total = parseFloat(r.totalReceivable);
  const overdueAmount = r.aging
    .filter((b) => b.bucket !== 'No vencido')
    .reduce((sum, b) => sum + parseFloat(b.amount), 0);
  const overduePct = total > 0 ? Math.round((overdueAmount / total) * 100) : 0;
  const hasOverdue = overdueAmount > 0;

  // Base positiva para las proporciones de la tira (los sobrepagos no aportan ancho).
  const barBase = r.aging.reduce((sum, b) => sum + Math.max(0, parseFloat(b.amount)), 0);
  const width = (b: ReceivableAgingBucket) =>
    barBase > 0 ? (Math.max(0, parseFloat(b.amount)) / barBase) * 100 : 0;

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Cartera</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-0.5">
            Lo por cobrar, por antigüedad y por cliente
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="text-xs">
          Actualizar
        </Button>
      </div>

      {/* ── Bloque 1 · Riesgo ── */}
      <section className="rounded-lg border p-5 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-[hsl(var(--muted-foreground))]">Total por cobrar</p>
            <p className="text-3xl font-bold tabular-nums mt-1">{formatMoney(r.totalReceivable)}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-[hsl(var(--muted-foreground))]">Vencido</p>
            <div className="flex items-baseline gap-2 mt-1">
              <p className={`text-3xl font-bold tabular-nums ${hasOverdue ? 'text-alert-red' : ''}`}>
                {formatMoney(overdueAmount.toFixed(2))}
              </p>
              <span
                className={`text-sm font-semibold ${hasOverdue ? 'text-alert-red' : 'text-[hsl(var(--muted-foreground))]'}`}
              >
                {overduePct}%
              </span>
            </div>
          </div>
        </div>

        {/* Tira de aging global */}
        <div className="space-y-2">
          <div className="flex h-3 w-full overflow-hidden rounded-full bg-[hsl(var(--muted)/0.5)]">
            {r.aging.map((b) => {
              const w = width(b);
              if (w <= 0) return null;
              return <div key={b.bucket} className={agingBar(b.bucket)} style={{ width: `${w}%` }} />;
            })}
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-1">
            {r.aging.map((b) => (
              <div key={b.bucket} className="flex items-center gap-1.5 text-xs">
                <span className={`inline-block h-2 w-2 rounded-full ${agingBar(b.bucket)}`} />
                <span className="text-[hsl(var(--muted-foreground))]">{b.bucket}</span>
                <span className="font-medium tabular-nums">{formatMoney(b.amount)}</span>
                <span className="text-[hsl(var(--muted-foreground))]">({b.count})</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Bloque 2 · Clientes ── */}
      <section className="rounded-lg border p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Clientes por saldo</h2>
          {r.byClient.length > 0 && (
            <span className="text-xs text-[hsl(var(--muted-foreground))]">
              Top {r.concentration.topN} concentran {r.concentration.pct}%
            </span>
          )}
        </div>
        {r.byClient.length === 0 ? (
          <p className="py-6 text-center text-sm text-[hsl(var(--muted-foreground))]">
            Sin saldos por cobrar.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="pb-2 text-left text-xs font-medium text-[hsl(var(--muted-foreground))]">Cliente</th>
                <th className="pb-2 text-right text-xs font-medium text-[hsl(var(--muted-foreground))]">Facturas</th>
                <th className="pb-2 text-right text-xs font-medium text-[hsl(var(--muted-foreground))]">Saldo</th>
              </tr>
            </thead>
            <tbody>
              {r.byClient.map((c) => (
                <tr key={c.clientId} className="border-b last:border-0">
                  <td className="py-2">{c.clientName}</td>
                  <td className="py-2 text-right tabular-nums text-[hsl(var(--muted-foreground))]">{c.count}</td>
                  <td className="py-2 text-right tabular-nums font-medium">{formatMoney(c.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* ── Bloque 3 · Acciones ── */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          onClick={() => navigate('/cuentas-cobro')}
          className="rounded-lg border p-4 flex items-center gap-3 text-left hover:shadow-sm transition-shadow"
        >
          <span className="p-2 rounded-md bg-stech-blue/10 text-stech-blue">
            <FileText className="h-5 w-5" />
          </span>
          <span className="flex-1">
            <span className="block text-sm font-medium">Cuentas de cobro</span>
            <span className="block text-xs text-[hsl(var(--muted-foreground))]">Gestionar y emitir</span>
          </span>
        </button>
        <button
          onClick={() => navigate('/pagos')}
          className="rounded-lg border p-4 flex items-center gap-3 text-left hover:shadow-sm transition-shadow"
        >
          <span className="p-2 rounded-md bg-node-teal/10 text-node-teal">
            <Wallet className="h-5 w-5" />
          </span>
          <span className="flex-1">
            <span className="block text-sm font-medium">Pagos recibidos</span>
            <span className="block text-xs text-[hsl(var(--muted-foreground))]">Registrar y consultar</span>
          </span>
        </button>
      </section>
    </div>
  );
}
