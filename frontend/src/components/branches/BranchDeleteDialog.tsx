import { useDeleteBranch } from '@/hooks/use-branches';
import type { Branch } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';

interface BranchDeleteDialogProps {
  clientId: string;
  branch: Branch | null;
  onOpenChange: (open: boolean) => void;
}

export function BranchDeleteDialog({
  clientId,
  branch,
  onOpenChange,
}: BranchDeleteDialogProps) {
  const deleteBranch = useDeleteBranch(clientId);

  async function handleDelete() {
    if (!branch) return;
    await deleteBranch.mutateAsync(branch.id);
    onOpenChange(false);
  }

  return (
    <Dialog open={!!branch} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Eliminar sede</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">
          ¿Seguro que deseas eliminar la sede{' '}
          <span className="font-medium text-[hsl(var(--foreground))]">{branch?.name}</span>?
          Esta acción no se puede deshacer.
        </p>
        {deleteBranch.error && (
          <p className="text-sm text-[hsl(var(--destructive))]">{deleteBranch.error.message}</p>
        )}
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={deleteBranch.isPending}>Cancelar</Button>
          </DialogClose>
          <Button variant="destructive" onClick={handleDelete} disabled={deleteBranch.isPending}>
            {deleteBranch.isPending ? 'Eliminando…' : 'Eliminar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
