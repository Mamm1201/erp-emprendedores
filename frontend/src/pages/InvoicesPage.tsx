import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Plus, Search, Eye } from 'lucide-react';

import { useInvoices } from '@/hooks/use-invoices';
import type { InvoiceStatus } from '@/lib/types';
import { formatMoney } from '@/lib/money';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const STATUS_LABELS: Record<InvoiceStatus, string> = {
  DRAFT: 'Borrador',
  ISSUED: 'Emitida',
  PARTIALLY_PAID: 'Pago parcial',
  PAID: 'Pagada',
  VOID: 'Anulada',
};

const STATUS_BADGE: Record<
  InvoiceStatus,
  'secondary' | 'info' | 'warning' | 'success' | 'danger'
> = {
  DRAFT: 'secondary',
  ISSUED: 'info',
  PARTIALLY_PAID: 'warning',
  PAID: 'success',
  VOID: 'danger',
};

const STATUS_FILTERS: { value: InvoiceStatus | ''; label: string }[] = [
  { value: '', label: 'Todas' },
  { value: 'DRAFT', label: 'Borrador' },
  { value: 'ISSUED', label: 'Emitidas' },
  { value: 'PARTIALLY_PAID', label: 'Pago parcial' },
  { value: 'PAID', label: 'Pagadas' },
  { value: 'VOID', label: 'Anuladas' },
];



export function InvoicesPage() {
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | ''>('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data, isLoading, isError } = useInvoices({ search, status: statusFilter, page });
  const invoices = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Cuentas de cobro</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-0.5">
            Documentos de cobro por servicios ejecutados
          </p>
        </div>
        <Button onClick={() => navigate('/cuentas-cobro/nueva')}>
          <Plus className="h-4 w-4" />
          Nueva cuenta de cobro
        </Button>
      </div>

      {/* Status tabs + search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-1 flex-wrap">
          {STATUS_FILTERS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => { setStatusFilter(value); setPage(1); }}
              className={cn(
                'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                statusFilter === value
                  ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
                  : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))]',
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="relative sm:ml-auto sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
          <Input
            className="pl-8"
            placeholder="Buscar número, cliente…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-[hsl(var(--muted)/0.4)]">
              <th className="px-4 py-3 text-left font-medium text-[hsl(var(--muted-foreground))] whitespace-nowrap">N° CC</th>
              <th className="px-4 py-3 text-left font-medium text-[hsl(var(--muted-foreground))]">Cliente</th>
              <th className="px-4 py-3 text-left font-medium text-[hsl(var(--muted-foreground))] hidden md:table-cell whitespace-nowrap">OT</th>
              <th className="px-4 py-3 text-left font-medium text-[hsl(var(--muted-foreground))] hidden md:table-cell whitespace-nowrap">Emisión</th>
              <th className="px-4 py-3 text-left font-medium text-[hsl(var(--muted-foreground))] hidden lg:table-cell whitespace-nowrap">Vencimiento</th>
              <th className="px-4 py-3 text-right font-medium text-[hsl(var(--muted-foreground))] whitespace-nowrap">Total</th>
              <th className="px-4 py-3 text-left font-medium text-[hsl(var(--muted-foreground))]">Estado</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={8} className="px-4 py-10 text-center text-[hsl(var(--muted-foreground))]">Cargando…</td></tr>
            )}
            {isError && (
              <tr><td colSpan={8} className="px-4 py-10 text-center text-[hsl(var(--destructive))]">Error al cargar las cuentas de cobro.</td></tr>
            )}
            {!isLoading && !isError && invoices.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-[hsl(var(--muted-foreground))]">
                  No hay cuentas de cobro para los filtros aplicados
                </td>
              </tr>
            )}
            {invoices.map((inv) => {
              const overdue =
                inv.status !== 'PAID' &&
                inv.status !== 'VOID' &&
                new Date(inv.dueDate) < new Date();

              return (
                <tr
                  key={inv.id}
                  className="border-b last:border-0 hover:bg-[hsl(var(--muted)/0.3)] transition-colors"
                >
                  <td className="px-4 py-3 font-mono text-xs font-medium whitespace-nowrap">
                    {inv.number}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium">
                      {inv.client.tradeName ?? inv.client.legalName}
                    </p>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-[hsl(var(--muted-foreground))] text-xs font-mono whitespace-nowrap">
                    {inv.workOrder.number}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-[hsl(var(--muted-foreground))] text-xs whitespace-nowrap">
                    {format(parseISO(inv.issueDate), 'd MMM yyyy', { locale: es })}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-xs whitespace-nowrap">
                    <span className={overdue ? 'text-alert-red font-medium' : 'text-[hsl(var(--muted-foreground))]'}>
                      {format(parseISO(inv.dueDate), 'd MMM yyyy', { locale: es })}
                      {overdue && ' ⚠'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-medium tabular-nums whitespace-nowrap">
                    {formatMoney(inv.total)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={STATUS_BADGE[inv.status]}>
                      {STATUS_LABELS[inv.status]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => navigate(`/cuentas-cobro/${inv.id}`)}
                      title="Ver detalle"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-[hsl(var(--muted-foreground))]">
          <span>
            {meta.total} cuenta{meta.total !== 1 ? 's' : ''} · página {meta.page} de {meta.totalPages}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage((p) => p - 1)} disabled={page <= 1}>
              Anterior
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={page >= meta.totalPages}>
              Siguiente
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
