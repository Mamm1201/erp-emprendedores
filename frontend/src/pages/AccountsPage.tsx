import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Pencil, Plus, Search } from 'lucide-react';

import {
  useAccounts,
  useCreateAccount,
  useUpdateAccount,
  type AccountFormData,
} from '@/hooks/use-accounts';
import type { Account } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';

// ─── Labels ───────────────────────────────────────────────────────────────────

export const INSTITUTION_TYPE_LABELS: Record<string, string> = {
  IPS: 'IPS',
  CLINIC: 'Clínica',
  HOSPITAL: 'Hospital',
  OTHER: 'Otra',
};

export const ACCOUNT_STATUS_LABELS: Record<string, string> = {
  ACTIVE_PROSPECT: 'Prospecto activo',
  CUSTOMER: 'Cliente',
  DORMANT: 'Inactivo',
  DISQUALIFIED: 'Descartado',
};

export const ACCOUNT_STATUS_BADGE: Record<string, 'secondary' | 'info' | 'success' | 'warning'> = {
  ACTIVE_PROSPECT: 'info',
  CUSTOMER: 'success',
  DORMANT: 'secondary',
  DISQUALIFIED: 'warning',
};

export const LEAD_SOURCE_LABELS: Record<string, string> = {
  LINKEDIN: 'LinkedIn',
  REFERRAL: 'Referido',
  INBOUND: 'Inbound',
  EVENT: 'Evento',
  OTHER: 'Otra',
};

const SELECT_CLASS =
  'flex h-9 w-full rounded-md border border-[hsl(var(--input))] bg-transparent px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] disabled:opacity-50';

// ─── Account form ─────────────────────────────────────────────────────────────

const accountSchema = z.object({
  legalName: z.string().min(1, 'La razón social es obligatoria').max(300),
  nit: z.string().max(50).optional().or(z.literal('')),
  city: z.string().min(1, 'La ciudad es obligatoria').max(150),
  institutionType: z.enum(['IPS', 'CLINIC', 'HOSPITAL', 'OTHER']),
  sizePotential: z.enum(['SMALL', 'MEDIUM', 'LARGE']).optional().or(z.literal('')),
  website: z.string().max(300).optional().or(z.literal('')),
  status: z.enum(['ACTIVE_PROSPECT', 'CUSTOMER', 'DORMANT', 'DISQUALIFIED']).optional(),
  source: z.enum(['LINKEDIN', 'REFERRAL', 'INBOUND', 'EVENT', 'OTHER']),
  notes: z.string().max(4000).optional().or(z.literal('')),
});

type AccountSchema = z.infer<typeof accountSchema>;

function toAccountDto(values: AccountSchema): AccountFormData {
  return {
    legalName: values.legalName,
    nit: values.nit || undefined,
    city: values.city,
    institutionType: values.institutionType,
    sizePotential: values.sizePotential || undefined,
    website: values.website || undefined,
    status: values.status,
    source: values.source,
    notes: values.notes || undefined,
  };
}

// ─── AccountFormModal (exportado — reutilizado desde AccountDetailPage) ───────

export interface AccountFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: Account | null;
}

export function AccountFormModal({ open, onOpenChange, editing }: AccountFormModalProps) {
  const createAccount = useCreateAccount();
  const updateAccount = useUpdateAccount();
  const isPending = createAccount.isPending || updateAccount.isPending;

  const { register, handleSubmit, reset, formState: { errors } } = useForm<AccountSchema>({
    resolver: zodResolver(accountSchema),
  });

  useEffect(() => {
    if (!open) return;
    reset(
      editing
        ? {
            legalName: editing.legalName,
            nit: editing.nit ?? '',
            city: editing.city,
            institutionType: editing.institutionType,
            sizePotential: editing.sizePotential ?? '',
            website: editing.website ?? '',
            status: editing.status,
            source: editing.source,
            notes: editing.notes ?? '',
          }
        : {
            legalName: '', nit: '', city: '', institutionType: 'IPS', sizePotential: '',
            website: '', status: 'ACTIVE_PROSPECT', source: 'REFERRAL', notes: '',
          },
    );
  }, [open, editing, reset]);

  async function onSubmit(values: AccountSchema) {
    const dto = toAccountDto(values);
    if (editing) {
      await updateAccount.mutateAsync({ id: editing.id, data: dto });
    } else {
      await createAccount.mutateAsync(dto);
    }
    onOpenChange(false);
  }

  const apiError = (createAccount.error ?? updateAccount.error)?.message;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? 'Editar cuenta' : 'Nueva cuenta'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="acc-legalName">Razón social *</Label>
            <Input id="acc-legalName" {...register('legalName')} placeholder="Clínica Demo S.A.S." />
            {errors.legalName && (
              <p className="text-xs text-[hsl(var(--destructive))]">{errors.legalName.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="acc-nit">NIT</Label>
              <Input id="acc-nit" {...register('nit')} placeholder="900.000.000-1" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="acc-city">Ciudad *</Label>
              <Input id="acc-city" {...register('city')} placeholder="Bogotá" />
              {errors.city && (
                <p className="text-xs text-[hsl(var(--destructive))]">{errors.city.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Tipo de institución *</Label>
              <select {...register('institutionType')} className={SELECT_CLASS}>
                {Object.entries(INSTITUTION_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Tamaño potencial</Label>
              <select {...register('sizePotential')} className={SELECT_CLASS}>
                <option value="">Sin definir</option>
                <option value="SMALL">Pequeño</option>
                <option value="MEDIUM">Mediano</option>
                <option value="LARGE">Grande</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Origen *</Label>
              <select {...register('source')} className={SELECT_CLASS}>
                {Object.entries(LEAD_SOURCE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Estado</Label>
              <select {...register('status')} className={SELECT_CLASS}>
                {Object.entries(ACCOUNT_STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="acc-website">Sitio web</Label>
            <Input id="acc-website" {...register('website')} placeholder="https://…" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="acc-notes">Notas</Label>
            <Textarea id="acc-notes" {...register('notes')} placeholder="Observaciones opcionales…" rows={3} />
          </div>

          {apiError && (
            <p className="text-sm text-[hsl(var(--destructive))]">{apiError}</p>
          )}

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isPending}>Cancelar</Button>
            </DialogClose>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Guardando…' : editing ? 'Guardar cambios' : 'Crear cuenta'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── AccountsPage ─────────────────────────────────────────────────────────────

export function AccountsPage() {
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);

  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data, isLoading, isError } = useAccounts(search, page);
  const accounts = data?.data ?? [];
  const meta = data?.meta;

  function openCreate() { setEditing(null); setFormOpen(true); }
  function openEdit(account: Account, e: React.MouseEvent) {
    e.stopPropagation();
    setEditing(account);
    setFormOpen(true);
  }

  const COL_COUNT = 6;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Prospección</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-0.5">
            Cuentas comerciales en gestión
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Nueva Account
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
        <Input
          className="pl-8"
          placeholder="Buscar por nombre…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-[hsl(var(--muted)/0.4)]">
              <th className="px-4 py-3 text-left font-medium text-[hsl(var(--muted-foreground))]">Cuenta</th>
              <th className="px-4 py-3 text-left font-medium text-[hsl(var(--muted-foreground))] hidden md:table-cell">NIT</th>
              <th className="px-4 py-3 text-left font-medium text-[hsl(var(--muted-foreground))] hidden md:table-cell">Ciudad</th>
              <th className="px-4 py-3 text-left font-medium text-[hsl(var(--muted-foreground))]">Tipo</th>
              <th className="px-4 py-3 text-left font-medium text-[hsl(var(--muted-foreground))]">Estado</th>
              <th className="px-4 py-3 text-right font-medium text-[hsl(var(--muted-foreground))]">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={COL_COUNT} className="px-4 py-10 text-center text-[hsl(var(--muted-foreground))]">
                  Cargando…
                </td>
              </tr>
            )}

            {isError && (
              <tr>
                <td colSpan={COL_COUNT} className="px-4 py-10 text-center text-[hsl(var(--destructive))]">
                  Error al cargar las cuentas. ¿El backend está corriendo?
                </td>
              </tr>
            )}

            {!isLoading && !isError && accounts.length === 0 && (
              <tr>
                <td colSpan={COL_COUNT} className="px-4 py-10 text-center text-[hsl(var(--muted-foreground))]">
                  {search ? `Sin resultados para "${search}"` : 'No hay cuentas registradas'}
                </td>
              </tr>
            )}

            {accounts.map((account) => (
              <tr
                key={account.id}
                className="border-b last:border-0 hover:bg-[hsl(var(--muted)/0.3)] transition-colors cursor-pointer"
                onClick={() => navigate(`/prospeccion/${account.id}`)}
              >
                <td className="px-4 py-3 font-medium">{account.legalName}</td>
                <td className="px-4 py-3 hidden md:table-cell font-mono text-xs">{account.nit ?? '—'}</td>
                <td className="px-4 py-3 hidden md:table-cell text-[hsl(var(--muted-foreground))]">{account.city}</td>
                <td className="px-4 py-3">{INSTITUTION_TYPE_LABELS[account.institutionType]}</td>
                <td className="px-4 py-3">
                  <Badge variant={ACCOUNT_STATUS_BADGE[account.status]}>
                    {ACCOUNT_STATUS_LABELS[account.status]}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end">
                    <Button variant="ghost" size="icon" onClick={(e) => openEdit(account, e)} title="Editar">
                      <Pencil className="h-4 w-4" />
                    </Button>
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

      <AccountFormModal
        open={formOpen}
        onOpenChange={(open) => { setFormOpen(open); if (!open) setEditing(null); }}
        editing={editing}
      />
    </div>
  );
}
