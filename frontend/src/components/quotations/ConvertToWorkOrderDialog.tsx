import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useCreateWorkOrder } from '@/hooks/use-work-orders';
import { useBranches } from '@/hooks/use-branches';
import type { Quotation, WorkOrderType } from '@/lib/types';
import {
  SELECTABLE_WORK_ORDER_TYPES,
  WORK_ORDER_TYPE_HELP,
  WORK_ORDER_TYPE_LABELS,
} from '@/lib/work-order-types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';

const SELECT_CLASS =
  'flex h-9 w-full rounded-md border border-[hsl(var(--input))] bg-transparent px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]';

type ConvertibleQuotation = Pick<
  Quotation,
  'id' | 'number' | 'clientId' | 'branchId' | 'clientLegalName' | 'client'
>;

// Conversion Cotizacion -> OT: se definen naturaleza, titulo y sede. La OT
// conserva quotationId y hereda las lineas de la cotizacion (backend).
export function ConvertToWorkOrderDialog({
  quotation,
  onOpenChange,
}: {
  quotation: ConvertibleQuotation | null;
  onOpenChange: (open: boolean) => void;
}) {
  const navigate = useNavigate();
  const createWO = useCreateWorkOrder();
  const { data: branches = [] } = useBranches(quotation?.clientId ?? null);

  const clientName = quotation
    ? (quotation.clientLegalName ?? quotation.client.legalName)
    : '';

  const [type, setType] = useState<WorkOrderType>('CORRECTIVE');
  const [title, setTitle] = useState('');
  // null: sin eleccion explicita -> se usa la sede por defecto.
  const [chosenBranchId, setChosenBranchId] = useState<string | null>(null);

  // Reinicia el formulario al abrir el dialogo para otra cotizacion.
  const [openedFor, setOpenedFor] = useState<string | null>(null);
  if (!quotation && openedFor !== null) setOpenedFor(null);
  if (quotation && quotation.id !== openedFor) {
    setOpenedFor(quotation.id);
    setType('CORRECTIVE');
    setTitle(`${quotation.number} — ${clientName}`);
    setChosenBranchId(null);
  }

  // Sede: la elegida; por defecto la de la cotizacion. Solo Suministro cae
  // ademas en la principal del cliente (C1); los demas tipos pueden ir sin sede.
  const isSupply = type === 'SUPPLY';
  const defaultBranchId =
    quotation?.branchId ??
    (isSupply ? (branches.find((b) => b.isPrimary) ?? branches[0])?.id : undefined) ??
    '';
  const branchId = chosenBranchId ?? defaultBranchId;

  async function handleConvert() {
    if (!quotation) return;
    await createWO.mutateAsync({
      clientId: quotation.clientId,
      quotationId: quotation.id,
      type,
      title: title.trim(),
      branchId: branchId || undefined,
    });
    onOpenChange(false);
    navigate('/ordenes');
  }

  const supplyWithoutBranch = isSupply && !branchId;

  return (
    <Dialog open={!!quotation} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Generar orden de trabajo</DialogTitle>
          {quotation && (
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              {quotation.number} — {clientName}
            </p>
          )}
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="space-y-1.5">
            <Label htmlFor="convert-type">Naturaleza *</Label>
            <select
              id="convert-type"
              className={SELECT_CLASS}
              value={type}
              onChange={(e) => setType(e.target.value as WorkOrderType)}
            >
              {SELECTABLE_WORK_ORDER_TYPES.map((t) => (
                <option key={t} value={t}>{WORK_ORDER_TYPE_LABELS[t]}</option>
              ))}
            </select>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">{WORK_ORDER_TYPE_HELP[type]}</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="convert-title">Título *</Label>
            <Input
              id="convert-title"
              value={title}
              maxLength={300}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="convert-branch">Sede</Label>
            <select
              id="convert-branch"
              className={SELECT_CLASS}
              value={branchId}
              disabled={branches.length === 0}
              onChange={(e) => setChosenBranchId(e.target.value)}
            >
              {branches.length === 0 ? (
                <option value="">El cliente no tiene sedes</option>
              ) : (
                <option value="">{isSupply ? 'Selecciona una sede…' : 'Sin sede'}</option>
              )}
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}{b.isPrimary ? ' (principal)' : ''}
                </option>
              ))}
            </select>
            {supplyWithoutBranch && (
              <p className="text-xs text-[hsl(var(--destructive))]">
                {branches.length === 0
                  ? 'Una OT de Suministro requiere sede. Registra una sede para este cliente antes de convertir.'
                  : 'Una OT de Suministro requiere sede.'}
              </p>
            )}
          </div>

          {createWO.error && (
            <p className="text-sm text-[hsl(var(--destructive))]">{createWO.error.message}</p>
          )}
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={createWO.isPending}>Cancelar</Button>
          </DialogClose>
          <Button
            type="button"
            disabled={createWO.isPending || !title.trim() || supplyWithoutBranch}
            onClick={handleConvert}
          >
            {createWO.isPending ? 'Creando OT…' : 'Generar OT'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
