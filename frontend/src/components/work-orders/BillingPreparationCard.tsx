import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  CheckCircle2,
  FileText,
  Loader2,
  Lock,
  Pencil,
  Receipt,
} from 'lucide-react';

import type {
  BillingPreparationElement,
  ResourceCategory,
  WorkOrder,
} from '@/lib/types';
import {
  useBillingPreparation,
  useOpenBillingPreparation,
  useSetResolution,
  useConfirmBillingPreparation,
  useCreateInvoiceFromPreparation,
} from '@/hooks/use-billing-preparation';
import { formatMoney } from '@/lib/money';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const CATEGORY_LABEL: Record<ResourceCategory, string> = {
  MATERIAL: 'Material',
  LABOR: 'Mano de obra',
  EXPENSE: 'Gasto',
};

// ─── Modal de resolución por elemento ─────────────────────────────────────────

function ResolutionModal({
  preparationId,
  workOrderId,
  element,
  onClose,
}: {
  preparationId: string;
  workOrderId: string;
  element: BillingPreparationElement | null;
  onClose: () => void;
}) {
  const setRes = useSetResolution(preparationId, workOrderId);
  const [resolution, setResolution] = useState<'CHARGE' | 'ABSORB'>('CHARGE');
  const [unitPrice, setUnitPrice] = useState('');
  const [discount, setDiscount] = useState('0');
  const [tax, setTax] = useState('0');

  useEffect(() => {
    if (!element) return;
    const r = element.resolution;
    setResolution(r?.resolution ?? 'CHARGE');
    setUnitPrice(r?.unitPrice ?? '');
    setDiscount(r?.discountAmount ?? '0');
    setTax(r?.taxRate ?? '0');
  }, [element]);

  const priceInvalid =
    resolution === 'CHARGE' &&
    (unitPrice === '' || isNaN(parseFloat(unitPrice)) || parseFloat(unitPrice) < 0);

  async function save() {
    if (!element) return;
    if (resolution === 'CHARGE') {
      await setRes.mutateAsync({
        utilizationId: element.utilization.id,
        resolution: 'CHARGE',
        unitPrice: parseFloat(unitPrice),
        discountAmount: parseFloat(discount) || 0,
        taxRate: parseFloat(tax) || 0,
      });
    } else {
      await setRes.mutateAsync({
        utilizationId: element.utilization.id,
        resolution: 'ABSORB',
      });
    }
    onClose();
  }

  return (
    <Dialog open={!!element} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{element?.utilization.resourceName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-xs text-[hsl(var(--muted-foreground))]">
            {element &&
              `${parseFloat(element.utilization.quantity).toLocaleString('es-CO', { maximumFractionDigits: 3 })} ${element.utilization.unit} · ${CATEGORY_LABEL[element.utilization.category]}`}
          </p>

          {/* Cobrar / Absorber */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setResolution('CHARGE')}
              className={`rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                resolution === 'CHARGE'
                  ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.08)] text-[hsl(var(--primary))]'
                  : 'text-[hsl(var(--muted-foreground))]'
              }`}
            >
              Cobrar
            </button>
            <button
              type="button"
              onClick={() => setResolution('ABSORB')}
              className={`rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                resolution === 'ABSORB'
                  ? 'border-[hsl(var(--foreground))] bg-[hsl(var(--muted)/0.4)]'
                  : 'text-[hsl(var(--muted-foreground))]'
              }`}
            >
              Absorber
            </button>
          </div>

          {resolution === 'CHARGE' && (
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="bp-price">Precio *</Label>
                <Input
                  id="bp-price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="bp-disc">Descuento</Label>
                <Input
                  id="bp-disc"
                  type="number"
                  step="0.01"
                  min="0"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="bp-tax">Impuesto %</Label>
                <Input
                  id="bp-tax"
                  type="number"
                  step="0.01"
                  min="0"
                  value={tax}
                  onChange={(e) => setTax(e.target.value)}
                />
              </div>
            </div>
          )}

          {resolution === 'ABSORB' && (
            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              El elemento se absorbe: no se cobra al cliente.
            </p>
          )}

          {setRes.error && (
            <p className="text-sm text-[hsl(var(--destructive))]">
              {setRes.error.message}
            </p>
          )}
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={setRes.isPending}>
              Cancelar
            </Button>
          </DialogClose>
          <Button onClick={save} disabled={setRes.isPending || priceInvalid}>
            {setRes.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
            ) : null}
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Diálogo generar Cuenta de Cobro ──────────────────────────────────────────

function GenerateInvoiceDialog({
  preparationId,
  workOrderId,
  open,
  onClose,
}: {
  preparationId: string;
  workOrderId: string;
  open: boolean;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const createInv = useCreateInvoiceFromPreparation(workOrderId);
  const [dueDate, setDueDate] = useState(
    format(new Date(Date.now() + 30 * 86400000), 'yyyy-MM-dd'),
  );

  async function generate() {
    const inv = await createInv.mutateAsync({ preparationId, dueDate });
    onClose();
    navigate(`/cuentas-cobro/${inv.id}`);
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Generar Cuenta de Cobro</DialogTitle>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label htmlFor="bp-due">Fecha de vencimiento</Label>
          <Input
            id="bp-due"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>
        {createInv.error && (
          <p className="text-sm text-[hsl(var(--destructive))]">
            {createInv.error.message}
          </p>
        )}
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={createInv.isPending}>
              Cancelar
            </Button>
          </DialogClose>
          <Button onClick={generate} disabled={createInv.isPending}>
            {createInv.isPending ? 'Generando…' : 'Generar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────

export function BillingPreparationCard({ workOrder }: { workOrder: WorkOrder }) {
  const workOrderId = workOrder.id;
  const isCompleted = workOrder.status === 'COMPLETED';
  const navigate = useNavigate();

  const { data: prep, isLoading, isError, error } = useBillingPreparation(
    workOrderId,
    isCompleted,
  );
  const openPrep = useOpenBillingPreparation(workOrderId);
  const confirmPrep = useConfirmBillingPreparation(prep?.id ?? '', workOrderId);

  const [editing, setEditing] = useState<BillingPreparationElement | null>(null);
  const [genOpen, setGenOpen] = useState(false);

  const notFound =
    isError && (error as { status?: number } | null)?.status === 404;

  function Header({ children }: { children?: React.ReactNode }) {
    return (
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold uppercase tracking-wide text-[hsl(var(--muted-foreground))] flex items-center gap-1.5">
            <Receipt className="h-3.5 w-3.5" />
            Preparación de Facturación
          </CardTitle>
          {children}
        </div>
      </CardHeader>
    );
  }

  // OT no cerrada → no disponible
  if (!isCompleted) {
    return (
      <Card>
        <Header />
        <CardContent>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            Disponible cuando la orden esté completada.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <Header />
        <CardContent>
          <div className="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))]">
            <Loader2 className="h-4 w-4 animate-spin" /> Cargando…
          </div>
        </CardContent>
      </Card>
    );
  }

  // Sin preparación aún
  if (notFound) {
    return (
      <Card>
        <Header />
        <CardContent>
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              Aún no se ha preparado la facturación de esta orden.
            </p>
            <Button
              size="sm"
              onClick={() => openPrep.mutate()}
              disabled={openPrep.isPending}
            >
              {openPrep.isPending ? 'Abriendo…' : 'Preparar facturación'}
            </Button>
          </div>
          {openPrep.error && (
            <p className="text-sm text-[hsl(var(--destructive))] mt-2">
              {openPrep.error.message}
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  if (isError || !prep) {
    return (
      <Card>
        <Header />
        <CardContent>
          <p className="text-sm text-[hsl(var(--destructive))]">
            Error al cargar la preparación.
          </p>
        </CardContent>
      </Card>
    );
  }

  const isDraft = prep.status === 'DRAFT';
  const canConfirm = isDraft && prep.result.pendingCount === 0;
  const hasInvoice = !!workOrder.invoice;

  return (
    <>
      <Card>
        <Header>
          {isDraft ? (
            <span className="text-xs font-medium px-2 py-0.5 rounded bg-[hsl(var(--muted)/0.5)] text-[hsl(var(--muted-foreground))]">
              Borrador
            </span>
          ) : (
            <span className="text-xs font-medium px-2 py-0.5 rounded bg-node-teal/10 text-node-teal flex items-center gap-1">
              <Lock className="h-3 w-3" /> Confirmada
            </span>
          )}
        </Header>

        <CardContent className="p-0">
          {/* Elementos */}
          <div className="divide-y">
            {prep.elements.map((el) => {
              const r = el.resolution;
              return (
                <div
                  key={el.utilization.id}
                  className="flex items-center justify-between gap-4 px-6 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="text-sm">
                      {el.utilization.resourceName}
                      <span className="ml-2 font-mono tabular-nums text-xs text-[hsl(var(--muted-foreground))]">
                        {parseFloat(el.utilization.quantity).toLocaleString('es-CO', { maximumFractionDigits: 3 })}{' '}
                        {el.utilization.unit}
                      </span>
                    </p>
                    <p className="text-xs mt-0.5">
                      {!r && (
                        <span className="text-[hsl(var(--destructive))] font-medium">
                          Pendiente de decidir
                        </span>
                      )}
                      {r?.resolution === 'CHARGE' && (
                        <span className="text-[hsl(var(--foreground))]">
                          Cobrar ·{' '}
                          <span className="font-mono tabular-nums font-medium">
                            {formatMoney(r.lineTotal)}
                          </span>
                        </span>
                      )}
                      {r?.resolution === 'ABSORB' && (
                        <span className="text-[hsl(var(--muted-foreground))]">
                          Absorbido (no se cobra)
                        </span>
                      )}
                    </p>
                  </div>
                  {isDraft && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs gap-1 shrink-0"
                      onClick={() => setEditing(el)}
                    >
                      <Pencil className="h-3 w-3" />
                      {r ? 'Editar' : 'Decidir'}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Resultado derivado */}
          <div className="px-6 py-3 border-t bg-[hsl(var(--muted)/0.15)] space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">Total a cobrar</span>
              <span className="font-mono tabular-nums text-sm font-bold">
                {formatMoney(prep.result.total)}
              </span>
            </div>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              {prep.result.chargedCount} cobrado(s) · {prep.result.absorbedCount} absorbido(s)
              {prep.result.pendingCount > 0 && (
                <span className="text-[hsl(var(--destructive))]">
                  {' '}· {prep.result.pendingCount} pendiente(s)
                </span>
              )}
            </p>
          </div>

          {/* Acciones */}
          <div className="px-6 py-3 border-t flex items-center justify-end gap-2">
            {isDraft && (
              <>
                {!canConfirm && (
                  <span className="text-xs text-[hsl(var(--muted-foreground))] mr-auto">
                    Resuelve todos los elementos para confirmar.
                  </span>
                )}
                <Button
                  size="sm"
                  onClick={() => confirmPrep.mutate()}
                  disabled={!canConfirm || confirmPrep.isPending}
                >
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                  {confirmPrep.isPending ? 'Confirmando…' : 'Confirmar preparación'}
                </Button>
              </>
            )}

            {!isDraft && hasInvoice && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate(`/cuentas-cobro/${workOrder.invoice!.id}`)}
              >
                <FileText className="h-3.5 w-3.5 mr-1.5" />
                Ver Cuenta de Cobro
              </Button>
            )}

            {!isDraft && !hasInvoice && (
              <Button size="sm" onClick={() => setGenOpen(true)}>
                <Receipt className="h-3.5 w-3.5 mr-1.5" />
                Generar Cuenta de Cobro
              </Button>
            )}
          </div>

          {confirmPrep.error && (
            <p className="text-sm text-[hsl(var(--destructive))] px-6 pb-3">
              {confirmPrep.error.message}
            </p>
          )}
        </CardContent>
      </Card>

      {isDraft && (
        <ResolutionModal
          preparationId={prep.id}
          workOrderId={workOrderId}
          element={editing}
          onClose={() => setEditing(null)}
        />
      )}

      <GenerateInvoiceDialog
        preparationId={prep.id}
        workOrderId={workOrderId}
        open={genOpen}
        onClose={() => setGenOpen(false)}
      />
    </>
  );
}
