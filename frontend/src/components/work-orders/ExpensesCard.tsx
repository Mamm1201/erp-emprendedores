import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Loader2, Pencil, Plus, Trash2, TrendingDown } from 'lucide-react';

import type { Expense, ExpenseCategory, WorkOrderStatus } from '@/lib/types';
import {
  useExpenses,
  useCreateExpense,
  useUpdateExpense,
  useDeleteExpense,
  type ExpenseFormData,
} from '@/hooks/use-expenses';
import { CATEGORY_LABEL, CATEGORY_ORDER } from '@/lib/expense-constants';
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

// ─── Zod schema ───────────────────────────────────────────────────────────────

const expenseSchema = z.object({
  category:    z.enum(['MATERIALS', 'LABOR', 'TRANSPORT', 'TOOLS', 'SUBCONTRACT', 'OFFICE', 'OTHER']),
  description: z.string().min(1, 'La descripción es obligatoria').max(500),
  amount:      z.coerce.number({ invalid_type_error: 'Ingresa un monto válido' }).positive('El monto debe ser mayor a 0'),
  expenseDate: z.string().optional(),
  vendorName:  z.string().max(200).optional().or(z.literal('')),
});

type ExpenseSchema = z.infer<typeof expenseSchema>;

function toDto(values: ExpenseSchema): ExpenseFormData {
  return {
    category:    values.category,
    description: values.description,
    amount:      values.amount,
    expenseDate: values.expenseDate || undefined,
    vendorName:  values.vendorName  || undefined,
  };
}

// ─── ExpenseFormModal ─────────────────────────────────────────────────────────

interface ExpenseFormModalProps {
  workOrderId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: Expense | null;
}

function ExpenseFormModal({ workOrderId, open, onOpenChange, editing }: ExpenseFormModalProps) {
  const createExpense = useCreateExpense(workOrderId);
  const updateExpense = useUpdateExpense(workOrderId);
  const isPending     = createExpense.isPending || updateExpense.isPending;

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ExpenseSchema>({
    resolver: zodResolver(expenseSchema),
  });

  useEffect(() => {
    if (!open) return;
    reset(
      editing
        ? {
            category:    editing.category,
            description: editing.description,
            amount:      parseFloat(editing.amount),
            expenseDate: editing.expenseDate
              ? editing.expenseDate.slice(0, 10)
              : '',
            vendorName: editing.vendorName ?? '',
          }
        : {
            category:    'MATERIALS',
            description: '',
            amount:      undefined as unknown as number,
            expenseDate: format(new Date(), 'yyyy-MM-dd'),
            vendorName:  '',
          },
    );
  }, [open, editing, reset]);

  async function onSubmit(values: ExpenseSchema) {
    const dto = toDto(values);
    if (editing) {
      await updateExpense.mutateAsync({ id: editing.id, data: dto });
    } else {
      await createExpense.mutateAsync(dto);
    }
    onOpenChange(false);
  }

  const apiError = (createExpense.error ?? updateExpense.error)?.message;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? 'Editar gasto' : 'Registrar gasto'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

          <div className="space-y-1.5">
            <Label htmlFor="exp-category">Categoría *</Label>
            <select
              id="exp-category"
              {...register('category')}
              className="w-full rounded-md border bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
            >
              {CATEGORY_ORDER.map((cat) => (
                <option key={cat} value={cat}>{CATEGORY_LABEL[cat]}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="exp-desc">Descripción *</Label>
            <Input
              id="exp-desc"
              {...register('description')}
              placeholder="Soldadura PVC, combustible, servicio técnico…"
            />
            {errors.description && (
              <p className="text-xs text-[hsl(var(--destructive))]">{errors.description.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="exp-amount">Monto *</Label>
              <Input
                id="exp-amount"
                type="number"
                step="0.01"
                min="0"
                {...register('amount')}
                placeholder="0.00"
              />
              {errors.amount && (
                <p className="text-xs text-[hsl(var(--destructive))]">{errors.amount.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="exp-date">Fecha</Label>
              <Input
                id="exp-date"
                type="date"
                {...register('expenseDate')}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="exp-vendor">Proveedor</Label>
            <Input
              id="exp-vendor"
              {...register('vendorName')}
              placeholder="Ferretería El Constructor…"
            />
          </div>

          {apiError && (
            <p className="text-sm text-[hsl(var(--destructive))]">{apiError}</p>
          )}

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isPending}>Cancelar</Button>
            </DialogClose>
            <Button type="submit" disabled={isPending}>
              {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
              {editing ? 'Guardar cambios' : 'Registrar gasto'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── DeleteConfirmDialog ──────────────────────────────────────────────────────

function DeleteConfirmDialog({
  workOrderId,
  expense,
  onOpenChange,
}: {
  workOrderId: string;
  expense: Expense | null;
  onOpenChange: (open: boolean) => void;
}) {
  const deleteExpense = useDeleteExpense(workOrderId);

  async function handleDelete() {
    if (!expense) return;
    await deleteExpense.mutateAsync(expense.id);
    onOpenChange(false);
  }

  return (
    <Dialog open={!!expense} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Eliminar gasto</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">
          ¿Seguro que deseas eliminar{' '}
          <span className="font-medium text-[hsl(var(--foreground))]">
            {expense?.description}
          </span>
          ? El registro se conservará en el historial.
        </p>
        {deleteExpense.error && (
          <p className="text-sm text-[hsl(var(--destructive))]">{deleteExpense.error.message}</p>
        )}
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={deleteExpense.isPending}>Cancelar</Button>
          </DialogClose>
          <Button variant="destructive" onClick={handleDelete} disabled={deleteExpense.isPending}>
            {deleteExpense.isPending ? 'Eliminando…' : 'Eliminar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── ExpensesCard ─────────────────────────────────────────────────────────────

interface ExpensesCardProps {
  workOrderId: string;
  workOrderStatus: WorkOrderStatus;
}

export function ExpensesCard({ workOrderId, workOrderStatus }: ExpensesCardProps) {
  const { data: expenses, isLoading, isError } = useExpenses(workOrderId);
  const [formOpen, setFormOpen]   = useState(false);
  const [editing, setEditing]     = useState<Expense | null>(null);
  const [deleting, setDeleting]   = useState<Expense | null>(null);

  const isReadOnly = workOrderStatus === 'COMPLETED' || workOrderStatus === 'CANCELLED';

  function openCreate() { setEditing(null); setFormOpen(true); }
  function openEdit(e: Expense) { setEditing(e); setFormOpen(true); }

  // Group by category, preserving order
  const grouped = CATEGORY_ORDER.reduce<Record<string, Expense[]>>((acc, cat) => {
    const items = (expenses ?? []).filter((e) => e.category === cat);
    if (items.length) acc[cat] = items;
    return acc;
  }, {});

  const hasExpenses = expenses && expenses.length > 0;

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold uppercase tracking-wide text-[hsl(var(--muted-foreground))] flex items-center gap-1.5">
              <TrendingDown className="h-3.5 w-3.5" />
              Costos
            </CardTitle>
            {!isReadOnly && (
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={openCreate}>
                <Plus className="h-3 w-3" />
                Registrar gasto
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading && (
            <div className="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))] px-6 pb-5">
              <Loader2 className="h-4 w-4 animate-spin" />
              Cargando costos…
            </div>
          )}

          {isError && (
            <p className="text-sm text-[hsl(var(--destructive))] px-6 pb-5">
              Error al cargar los costos.
            </p>
          )}

          {!isLoading && !isError && !hasExpenses && (
            <div className="flex items-center justify-between px-6 pb-5 pt-1">
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                Aún no hay costos registrados para esta orden.
              </p>
            </div>
          )}

          {hasExpenses && (
            <div className="divide-y">
              {Object.entries(grouped).map(([cat, items]) => {
                const catTotal = items.reduce((s, e) => s + parseFloat(e.amount), 0);
                return (
                  <div key={cat}>
                    {/* Category header */}
                    <div className="flex items-center justify-between px-6 py-2 bg-[hsl(var(--muted)/0.3)]">
                      <span className="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide">
                        {CATEGORY_LABEL[cat as ExpenseCategory]}
                      </span>
                      <span className="text-xs font-mono font-medium text-[hsl(var(--muted-foreground))]">
                        {formatMoney(catTotal)}
                      </span>
                    </div>

                    {/* Expense rows */}
                    {items.map((expense) => (
                      <div
                        key={expense.id}
                        className="flex items-center justify-between gap-4 px-6 py-2.5 hover:bg-[hsl(var(--muted)/0.2)] group"
                      >
                        <div className="min-w-0">
                          <p className="text-sm">{expense.description}</p>
                          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
                            {format(parseISO(expense.expenseDate.slice(0, 10)), 'd MMM yyyy', { locale: es })}
                            {expense.vendorName && ` · ${expense.vendorName}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-mono tabular-nums text-sm font-medium">
                            {formatMoney(expense.amount)}
                          </span>
                          {!isReadOnly && (
                            <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost" size="icon"
                                className="h-7 w-7"
                                title="Editar"
                                onClick={() => openEdit(expense)}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost" size="icon"
                                className="h-7 w-7 text-[hsl(var(--destructive))] hover:text-[hsl(var(--destructive))]"
                                title="Eliminar"
                                onClick={() => setDeleting(expense)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}

              {/* Grand total */}
              <div className="flex items-center justify-between px-6 py-3 border-t bg-[hsl(var(--muted)/0.15)]">
                <span className="text-sm font-semibold">Total costos</span>
                <span className="font-mono tabular-nums text-sm font-bold">
                  {formatMoney(expenses.reduce((s, e) => s + parseFloat(e.amount), 0))}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {!isReadOnly && (
        <>
          <ExpenseFormModal
            workOrderId={workOrderId}
            open={formOpen}
            onOpenChange={(open) => { setFormOpen(open); if (!open) setEditing(null); }}
            editing={editing}
          />
          <DeleteConfirmDialog
            workOrderId={workOrderId}
            expense={deleting}
            onOpenChange={(open) => { if (!open) setDeleting(null); }}
          />
        </>
      )}
    </>
  );
}
