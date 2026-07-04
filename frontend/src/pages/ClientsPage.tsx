import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Building2, ChevronRight, Pencil, Plus, Search, Trash2, User } from 'lucide-react';

import { useClients, useCreateClient, useUpdateClient, useDeleteClient, type ClientFormData } from '@/hooks/use-clients';
import type { Client } from '@/lib/types';
import { BranchList } from '@/components/branches/BranchList';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';

// ─── Client form ──────────────────────────────────────────────────────────────

const clientSchema = z.object({
  legalName: z.string().min(1, 'La razón social es obligatoria').max(200),
  tradeName: z.string().max(200).optional().or(z.literal('')),
  taxId:     z.string().max(50).optional().or(z.literal('')),
  email:     z.string().email('Email inválido').optional().or(z.literal('')),
  phone:     z.string().max(50).optional().or(z.literal('')),
  notes:     z.string().max(2000).optional().or(z.literal('')),
  type:      z.enum(['COMPANY', 'PERSON']).optional(),
});

type ClientSchema = z.infer<typeof clientSchema>;

function toClientDto(values: ClientSchema): ClientFormData {
  return {
    legalName: values.legalName,
    tradeName: values.tradeName || undefined,
    taxId:     values.taxId     || undefined,
    email:     values.email     || undefined,
    phone:     values.phone     || undefined,
    notes:     values.notes     || undefined,
    type:      values.type,
  };
}

// ─── ClientFormModal ──────────────────────────────────────────────────────────

interface ClientFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: Client | null;
}

function ClientFormModal({ open, onOpenChange, editing }: ClientFormModalProps) {
  const createClient = useCreateClient();
  const updateClient = useUpdateClient();
  const isPending = createClient.isPending || updateClient.isPending;

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ClientSchema>({
    resolver: zodResolver(clientSchema),
  });

  useEffect(() => {
    if (!open) return;
    reset(
      editing
        ? {
            legalName: editing.legalName,
            tradeName: editing.tradeName ?? '',
            taxId:     editing.taxId     ?? '',
            email:     editing.email     ?? '',
            phone:     editing.phone     ?? '',
            notes:     editing.notes     ?? '',
            type:      editing.type,
          }
        : { legalName: '', tradeName: '', taxId: '', email: '', phone: '', notes: '', type: 'COMPANY' },
    );
  }, [open, editing, reset]);

  async function onSubmit(values: ClientSchema) {
    const dto = toClientDto(values);
    if (editing) {
      await updateClient.mutateAsync({ id: editing.id, data: dto });
    } else {
      await createClient.mutateAsync(dto);
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? 'Editar cliente' : 'Nuevo cliente'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Tipo</Label>
            <div className="flex gap-3">
              {(['COMPANY', 'PERSON'] as const).map((t) => (
                <label key={t} className="flex items-center gap-2 cursor-pointer text-sm">
                  <input type="radio" value={t} {...register('type')} className="accent-[hsl(var(--primary))]" />
                  {t === 'COMPANY' ? 'Empresa' : 'Persona natural'}
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="legalName">Razón social *</Label>
            <Input id="legalName" {...register('legalName')} placeholder="Clínica Emmanuel S.A.S." />
            {errors.legalName && (
              <p className="text-xs text-[hsl(var(--destructive))]">{errors.legalName.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="tradeName">Nombre comercial</Label>
            <Input id="tradeName" {...register('tradeName')} placeholder="Clínica Emmanuel" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="taxId">NIT</Label>
              <Input id="taxId" {...register('taxId')} placeholder="900.000.000-1" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Teléfono</Label>
              <Input id="phone" {...register('phone')} placeholder="601 234 5678" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...register('email')} placeholder="contacto@clinica.com" />
            {errors.email && (
              <p className="text-xs text-[hsl(var(--destructive))]">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Notas</Label>
            <Textarea id="notes" {...register('notes')} placeholder="Observaciones opcionales…" rows={3} />
          </div>

          {(createClient.error || updateClient.error) && (
            <p className="text-sm text-[hsl(var(--destructive))]">
              {(createClient.error ?? updateClient.error)?.message}
            </p>
          )}

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isPending}>Cancelar</Button>
            </DialogClose>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Guardando…' : editing ? 'Guardar cambios' : 'Crear cliente'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── DeleteConfirmDialog ──────────────────────────────────────────────────────

interface DeleteConfirmProps {
  client: Client | null;
  onOpenChange: (open: boolean) => void;
}

function DeleteConfirmDialog({ client, onOpenChange }: DeleteConfirmProps) {
  const deleteClient = useDeleteClient();

  async function handleDelete() {
    if (!client) return;
    await deleteClient.mutateAsync(client.id);
    onOpenChange(false);
  }

  return (
    <Dialog open={!!client} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Eliminar cliente</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">
          ¿Seguro que deseas eliminar{' '}
          <span className="font-medium text-[hsl(var(--foreground))]">{client?.legalName}</span>?
          Esta acción no se puede deshacer.
        </p>
        {deleteClient.error && (
          <p className="text-sm text-[hsl(var(--destructive))]">{deleteClient.error.message}</p>
        )}
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={deleteClient.isPending}>Cancelar</Button>
          </DialogClose>
          <Button variant="destructive" onClick={handleDelete} disabled={deleteClient.isPending}>
            {deleteClient.isPending ? 'Eliminando…' : 'Eliminar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── ClientsPage ──────────────────────────────────────────────────────────────

export function ClientsPage() {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch]           = useState('');
  const [page, setPage]               = useState(1);
  const [formOpen, setFormOpen]       = useState(false);
  const [editing, setEditing]         = useState<Client | null>(null);
  const [deleting, setDeleting]       = useState<Client | null>(null);
  const [expandedId, setExpandedId]   = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data, isLoading, isError } = useClients(search, page);
  const clients = data?.data ?? [];
  const meta    = data?.meta;

  function toggleExpand(clientId: string) {
    setExpandedId((prev) => (prev === clientId ? null : clientId));
  }

  function openCreate() { setEditing(null); setFormOpen(true); }
  function openEdit(client: Client) { setEditing(client); setFormOpen(true); }

  const COL_COUNT = 7;

  return (
    <div className="p-6 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Clientes</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-0.5">
            Instituciones prestadoras de servicios de salud
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Nuevo cliente
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
        <Input
          className="pl-8"
          placeholder="Buscar por nombre, NIT o email…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-[hsl(var(--muted)/0.4)]">
              {/* Expand column */}
              <th className="w-9 px-2" />
              <th className="px-4 py-3 text-left font-medium text-[hsl(var(--muted-foreground))]">Cliente</th>
              <th className="px-4 py-3 text-left font-medium text-[hsl(var(--muted-foreground))]">NIT</th>
              <th className="px-4 py-3 text-left font-medium text-[hsl(var(--muted-foreground))] hidden md:table-cell">Email</th>
              <th className="px-4 py-3 text-left font-medium text-[hsl(var(--muted-foreground))] hidden md:table-cell">Teléfono</th>
              <th className="px-4 py-3 text-left font-medium text-[hsl(var(--muted-foreground))]">Tipo</th>
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
                  Error al cargar los clientes. ¿El backend está corriendo?
                </td>
              </tr>
            )}

            {!isLoading && !isError && clients.length === 0 && (
              <tr>
                <td colSpan={COL_COUNT} className="px-4 py-10 text-center text-[hsl(var(--muted-foreground))]">
                  {search ? `Sin resultados para "${search}"` : 'No hay clientes registrados'}
                </td>
              </tr>
            )}

            {clients.map((client) => {
              const isExpanded = expandedId === client.id;
              return (
                <React.Fragment key={client.id}>
                  {/* Client row */}
                  <tr
                    className={cn(
                      'border-b transition-colors',
                      isExpanded
                        ? 'bg-[hsl(var(--muted)/0.4)]'
                        : 'hover:bg-[hsl(var(--muted)/0.3)]',
                    )}
                  >
                    {/* Expand toggle */}
                    <td className="w-9 px-2 py-3">
                      <button
                        onClick={() => toggleExpand(client.id)}
                        className="flex items-center justify-center w-6 h-6 rounded hover:bg-[hsl(var(--muted))] transition-colors text-[hsl(var(--muted-foreground))]"
                        title={isExpanded ? 'Ocultar sedes' : 'Ver sedes'}
                        aria-expanded={isExpanded}
                      >
                        <ChevronRight
                          className={cn('h-4 w-4 transition-transform duration-150', isExpanded && 'rotate-90')}
                        />
                      </button>
                    </td>

                    <td className="px-4 py-3">
                      <p className="font-medium">{client.legalName}</p>
                      {client.tradeName && (
                        <p className="text-xs text-[hsl(var(--muted-foreground))]">{client.tradeName}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{client.taxId ?? '—'}</td>
                    <td className="px-4 py-3 hidden md:table-cell text-[hsl(var(--muted-foreground))]">
                      {client.email ?? '—'}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-[hsl(var(--muted-foreground))]">
                      {client.phone ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      {client.type === 'COMPANY' ? (
                        <Badge variant="info" className="gap-1">
                          <Building2 className="h-3 w-3" /> Empresa
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1">
                          <User className="h-3 w-3" /> Natural
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(client)} title="Editar">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleting(client)}
                          title="Eliminar"
                          className="text-[hsl(var(--destructive))] hover:text-[hsl(var(--destructive))]"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>

                  {/* Branch sub-row */}
                  {isExpanded && (
                    <tr>
                      <td colSpan={COL_COUNT} className="p-0">
                        <BranchList clientId={client.id} />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}

          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-[hsl(var(--muted-foreground))]">
          <span>
            {meta.total} cliente{meta.total !== 1 ? 's' : ''} · página {meta.page} de {meta.totalPages}
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

      {/* Modals */}
      <ClientFormModal
        open={formOpen}
        onOpenChange={(open) => { setFormOpen(open); if (!open) setEditing(null); }}
        editing={editing}
      />
      <DeleteConfirmDialog
        client={deleting}
        onOpenChange={(open) => { if (!open) setDeleting(null); }}
      />
    </div>
  );
}
