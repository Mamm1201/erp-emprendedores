import { useState } from 'react';
import { MapPin, Pencil, Plus, Trash2 } from 'lucide-react';

import { useBranches } from '@/hooks/use-branches';
import type { Branch } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BranchFormModal } from './BranchFormModal';
import { BranchDeleteDialog } from './BranchDeleteDialog';

interface BranchListProps {
  clientId: string;
}

export function BranchList({ clientId }: BranchListProps) {
  const { data: branches, isLoading, isError } = useBranches(clientId);
  const [formOpen, setFormOpen]     = useState(false);
  const [editing, setEditing]       = useState<Branch | null>(null);
  const [deleting, setDeleting]     = useState<Branch | null>(null);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(branch: Branch) {
    setEditing(branch);
    setFormOpen(true);
  }

  return (
    <div className="bg-[hsl(var(--muted)/0.25)] border-t">

      {/* Sub-header */}
      <div className="flex items-center justify-between px-6 py-2.5 border-b bg-[hsl(var(--muted)/0.15)]">
        <p className="text-xs font-semibold uppercase tracking-wide text-[hsl(var(--muted-foreground))] flex items-center gap-1.5">
          <MapPin className="h-3 w-3" />
          Sedes
          {branches && branches.length > 0 && (
            <span className="font-normal">· {branches.length}</span>
          )}
        </p>
        <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={openCreate}>
          <Plus className="h-3 w-3" />
          Nueva sede
        </Button>
      </div>

      {/* Content */}
      <div className="px-6 py-3">
        {isLoading && (
          <p className="text-xs text-[hsl(var(--muted-foreground))] py-2">Cargando sedes…</p>
        )}

        {isError && (
          <p className="text-xs text-[hsl(var(--destructive))] py-2">Error al cargar las sedes.</p>
        )}

        {!isLoading && !isError && branches?.length === 0 && (
          <div className="flex items-center justify-between py-2">
            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              Este cliente no tiene sedes registradas.
            </p>
            <Button size="sm" variant="ghost" className="h-7 text-xs gap-1 text-[hsl(var(--primary))]" onClick={openCreate}>
              <Plus className="h-3 w-3" />
              Añadir primera sede
            </Button>
          </div>
        )}

        {branches && branches.length > 0 && (
          <div className="divide-y divide-[hsl(var(--border)/0.5)]">
            {branches.map((branch) => (
              <div
                key={branch.id}
                className="flex items-start justify-between gap-4 py-2.5 first:pt-0 last:pb-0"
              >
                {/* Branch info */}
                <div className="min-w-0 flex items-start gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium">{branch.name}</p>
                      {branch.isPrimary && (
                        <Badge variant="default" className="text-[10px] px-1.5 py-0 h-4">
                          Principal
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
                      {[branch.city, branch.department].filter(Boolean).join(', ') || '—'}
                      {branch.contactName && ` · ${branch.contactName}`}
                      {branch.contactPhone && ` · ${branch.contactPhone}`}
                    </p>
                    {branch.address && (
                      <p className="text-xs text-[hsl(var(--muted-foreground)/0.7)] mt-0.5 truncate max-w-sm">
                        {branch.address}
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-0.5 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    title="Editar sede"
                    onClick={() => openEdit(branch)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-[hsl(var(--destructive))] hover:text-[hsl(var(--destructive))]"
                    title="Eliminar sede"
                    onClick={() => setDeleting(branch)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <BranchFormModal
        clientId={clientId}
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditing(null);
        }}
        editing={editing}
      />
      <BranchDeleteDialog
        clientId={clientId}
        branch={deleting}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
      />
    </div>
  );
}
