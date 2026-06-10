import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Plus, Search, Eye, Trash2, ChevronRight } from 'lucide-react';

import {
  useQuotations,
  useUpdateQuotationStatus,
  useDeleteQuotation,
} from '@/hooks/use-quotations';
import { useCreateWorkOrder } from '@/hooks/use-work-orders';
import type { Quotation, QuotationStatus } from '@/lib/types';
import { formatMoney } from '@/lib/money';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<QuotationStatus, string> = {
  DRAFT: 'Borrador',
  SENT: 'Enviada',
  APPROVED: 'Aprobada',
  REJECTED: 'Rechazada',
  EXPIRED: 'Expirada',
  CONVERTED: 'Convertida',
  CANCELLED: 'Cancelada',
};

const STATUS_BADGE: Record<QuotationStatus, 'secondary' | 'info' | 'success' | 'danger' | 'warning'> = {
  DRAFT: 'secondary',
  SENT: 'info',
  APPROVED: 'success',
  REJECTED: 'danger',
  EXPIRED: 'warning',
  CONVERTED: 'info',
  CANCELLED: 'danger',
};

const STATUS_FILTERS: { value: QuotationStatus | ''; label: string }[] = [
  { value: '', label: 'Todas' },
  { value: 'DRAFT', label: 'Borrador' },
  { value: 'SENT', label: 'Enviadas' },
  { value: 'APPROVED', label: 'Aprobadas' },
  { value: 'CONVERTED', label: 'Convertidas' },
  { value: 'CANCELLED', label: 'Canceladas' },
];

// ─── Status actions per row ───────────────────────────────────────────────────

function QuotationActions({ quotation, onDelete }: { quotation: Quotation; onDelete: () => void }) {
  const updateStatus = useUpdateQuotationStatus();
  const createWO = useCreateWorkOrder();
  const navigate = useNavigate();
  const isBusy = updateStatus.isPending || createWO.isPending;

  async function convertToWorkOrder() {
    await createWO.mutateAsync({
      clientId: quotation.clientId,
      branchId: quotation.branchId ?? undefined,
      quotationId: quotation.id,
      title: `Visita técnica — ${quotation.clientLegalName ?? quotation.client.legalName}`,
    });
    navigate('/ordenes');
  }

  return (
    <div className="flex justify-end gap-1 flex-wrap">
      {quotation.status === 'DRAFT' && (
        <Button size="sm" variant="outline" className="text-xs h-7 gap-1" disabled={isBusy}
          onClick={() => updateStatus.mutate({ id: quotation.id, status: 'SENT' })}>
          Enviar <ChevronRight className="h-3 w-3" />
        </Button>
      )}
      {quotation.status === 'SENT' && (
        <>
          <Button size="sm" variant="outline" className="text-xs h-7 gap-1 text-green-700 border-green-300 hover:bg-green-50" disabled={isBusy}
            onClick={() => updateStatus.mutate({ id: quotation.id, status: 'APPROVED' })}>
            Aprobar
          </Button>
          <Button size="sm" variant="ghost" className="text-xs h-7 text-[hsl(var(--destructive))] hover:text-[hsl(var(--destructive))]" disabled={isBusy}
            onClick={() => updateStatus.mutate({ id: quotation.id, status: 'REJECTED' })}>
            Rechazar
          </Button>
        </>
      )}
      {quotation.status === 'APPROVED' && (
        <Button size="sm" className="text-xs h-7 gap-1 bg-green-600 hover:bg-green-700" disabled={isBusy}
          onClick={convertToWorkOrder}>
          {createWO.isPending ? 'Creando OT…' : 'Generar OT'}
          <ChevronRight className="h-3 w-3" />
        </Button>
      )}
      {(quotation.status === 'SENT' || quotation.status === 'APPROVED') && (
        <Button size="sm" variant="ghost" className="text-xs h-7 text-[hsl(var(--muted-foreground))]" disabled={isBusy}
          onClick={() => updateStatus.mutate({ id: quotation.id, status: 'CANCELLED' })}>
          Cancelar
        </Button>
      )}
      {quotation.status === 'DRAFT' && (
        <Button variant="ghost" size="icon" className="h-7 w-7 text-[hsl(var(--destructive))] hover:text-[hsl(var(--destructive))]"
          onClick={onDelete} title="Eliminar">
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}

// ─── DeleteConfirmDialog ──────────────────────────────────────────────────────

function DeleteConfirmDialog({ quotation, onOpenChange }: { quotation: Quotation | null; onOpenChange: (open: boolean) => void }) {
  const deleteQ = useDeleteQuotation();
  async function handleDelete() {
    if (!quotation) return;
    await deleteQ.mutateAsync(quotation.id);
    onOpenChange(false);
  }
  return (
    <Dialog open={!!quotation} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Eliminar cotización</DialogTitle></DialogHeader>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">
          ¿Seguro que deseas eliminar <span className="font-medium text-[hsl(var(--foreground))]">{quotation?.number}</span>?
        </p>
        {deleteQ.error && <p className="text-sm text-[hsl(var(--destructive))]">{deleteQ.error.message}</p>}
        <DialogFooter>
          <DialogClose asChild><Button variant="outline" disabled={deleteQ.isPending}>Cancelar</Button></DialogClose>
          <Button variant="destructive" onClick={handleDelete} disabled={deleteQ.isPending}>
            {deleteQ.isPending ? 'Eliminando…' : 'Eliminar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── QuotationsPage ───────────────────────────────────────────────────────────

export function QuotationsPage() {
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<QuotationStatus | ''>('');
  const [page, setPage] = useState(1);
  const [deleting, setDeleting] = useState<Quotation | null>(null);

  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data, isLoading, isError } = useQuotations({ search, status: statusFilter, page });
  const quotations = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Cotizaciones</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-0.5">
            Propuestas comerciales a clientes
          </p>
        </div>
        <Button onClick={() => navigate('/cotizaciones/nueva')}>
          <Plus className="h-4 w-4" />
          Nueva cotización
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-1 flex-wrap">
          {STATUS_FILTERS.map(({ value, label }) => (
            <button key={value} onClick={() => { setStatusFilter(value); setPage(1); }}
              className={cn(
                'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                statusFilter === value
                  ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
                  : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))]',
              )}>
              {label}
            </button>
          ))}
        </div>
        <div className="relative sm:ml-auto sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
          <Input className="pl-8" placeholder="Buscar número, cliente…" value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)} />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-[hsl(var(--muted)/0.4)]">
              <th className="px-4 py-3 text-left font-medium text-[hsl(var(--muted-foreground))] whitespace-nowrap">N° COT</th>
              <th className="px-4 py-3 text-left font-medium text-[hsl(var(--muted-foreground))]">Cliente</th>
              <th className="px-4 py-3 text-left font-medium text-[hsl(var(--muted-foreground))] hidden md:table-cell">Fecha</th>
              <th className="px-4 py-3 text-left font-medium text-[hsl(var(--muted-foreground))] hidden md:table-cell">Vigencia</th>
              <th className="px-4 py-3 text-right font-medium text-[hsl(var(--muted-foreground))]">Total</th>
              <th className="px-4 py-3 text-left font-medium text-[hsl(var(--muted-foreground))]">Estado</th>
              <th className="px-4 py-3 text-right font-medium text-[hsl(var(--muted-foreground))]">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-[hsl(var(--muted-foreground))]">Cargando…</td></tr>
            )}
            {isError && (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-[hsl(var(--destructive))]">Error al cargar las cotizaciones.</td></tr>
            )}
            {!isLoading && !isError && quotations.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-[hsl(var(--muted-foreground))]">
                  No hay cotizaciones para los filtros aplicados
                </td>
              </tr>
            )}
            {quotations.map((q) => (
              <tr key={q.id} className="border-b last:border-0 hover:bg-[hsl(var(--muted)/0.3)] transition-colors">
                <td className="px-4 py-3 font-mono text-xs font-medium whitespace-nowrap">{q.number}</td>
                <td className="px-4 py-3">
                  <p className="font-medium">{q.clientLegalName ?? q.client.tradeName ?? q.client.legalName}</p>
                  {(q.branchName ?? q.branch?.name) && (
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">
                      {q.branchName ?? q.branch?.name}{(q.branchCity ?? q.branch?.city) ? ` · ${q.branchCity ?? q.branch?.city}` : ''}
                    </p>
                  )}
                </td>
                <td className="px-4 py-3 hidden md:table-cell text-[hsl(var(--muted-foreground))] text-xs whitespace-nowrap">
                  {format(parseISO(q.issueDate), 'd MMM yyyy', { locale: es })}
                </td>
                <td className="px-4 py-3 hidden md:table-cell text-[hsl(var(--muted-foreground))] text-xs whitespace-nowrap">
                  {q.validUntil ? format(parseISO(q.validUntil), 'd MMM yyyy', { locale: es }) : '—'}
                </td>
                <td className="px-4 py-3 text-right font-medium tabular-nums whitespace-nowrap">
                  {formatMoney(q.total)}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={STATUS_BADGE[q.status]}>{STATUS_LABELS[q.status]}</Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7"
                      onClick={() => navigate(`/cotizaciones/${q.id}`)} title="Ver detalle">
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                    <QuotationActions quotation={q} onDelete={() => setDeleting(q)} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-[hsl(var(--muted-foreground))]">
          <span>{meta.total} cotización{meta.total !== 1 ? 'es' : ''} · página {meta.page} de {meta.totalPages}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage((p) => p - 1)} disabled={page <= 1}>Anterior</Button>
            <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={page >= meta.totalPages}>Siguiente</Button>
          </div>
        </div>
      )}

      <DeleteConfirmDialog quotation={deleting} onOpenChange={(open) => { if (!open) setDeleting(null); }} />
    </div>
  );
}
