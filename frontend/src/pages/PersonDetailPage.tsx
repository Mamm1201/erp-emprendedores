import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { QRCodeCanvas } from 'qrcode.react';
import { ArrowLeft, ShieldCheck, ShieldX, RefreshCw } from 'lucide-react';

import { usePerson } from '@/hooks/use-persons';
import {
  useAccreditations,
  useIssueAccreditation,
  useRevokeAccreditation,
  useReissueAccreditation,
} from '@/hooks/use-accreditations';
import type { Accreditation } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
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
import { PERSON_PROFILE_LABELS, RELATIONSHIP_TYPE_LABELS } from './PersonsPage';

const PORTAL_BASE =
  (import.meta.env.VITE_PORTAL_URL as string | undefined) ?? 'http://localhost:5174';

function buildAccreditationPortalUrl(qrCode: string) {
  return `${PORTAL_BASE}/p/${qrCode}`;
}

const accreditationSchema = z.object({
  displayRole: z.string().min(1, 'La etiqueta pública es obligatoria').max(100),
  validFrom: z.string().optional().or(z.literal('')),
  validUntil: z.string().optional().or(z.literal('')),
});

type AccreditationForm = z.infer<typeof accreditationSchema>;

export function PersonDetailPage() {
  const { id } = useParams<{ id: string }>();
  const personId = id ?? '';

  const { data: person, isLoading: loadingPerson } = usePerson(personId);
  const { data: accreditations = [], isLoading: loadingAccreditations } =
    useAccreditations(personId);

  const [issueOpen, setIssueOpen] = useState(false);
  const [reissueOpen, setReissueOpen] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<Accreditation | null>(null);
  const [qrTarget, setQrTarget] = useState<Accreditation | null>(null);

  const issueAccreditation = useIssueAccreditation(personId);
  const reissueAccreditation = useReissueAccreditation(personId);
  const revokeAccreditation = useRevokeAccreditation(personId);

  const issueForm = useForm<AccreditationForm>({ resolver: zodResolver(accreditationSchema) });
  const reissueForm = useForm<AccreditationForm>({ resolver: zodResolver(accreditationSchema) });

  const active = accreditations.find((a) => a.status === 'ACTIVE') ?? null;
  const history = accreditations.filter((a) => a.status !== 'ACTIVE');

  function toPayload(data: AccreditationForm) {
    return {
      displayRole: data.displayRole,
      validFrom: data.validFrom || undefined,
      validUntil: data.validUntil || undefined,
    };
  }

  function handleIssue(data: AccreditationForm) {
    issueAccreditation.mutate(toPayload(data), {
      onSuccess: () => {
        setIssueOpen(false);
        issueForm.reset();
      },
    });
  }

  function handleReissue(data: AccreditationForm) {
    reissueAccreditation.mutate(toPayload(data), {
      onSuccess: () => {
        setReissueOpen(false);
        reissueForm.reset();
      },
    });
  }

  if (loadingPerson) {
    return <p className="text-sm text-muted-foreground">Cargando persona...</p>;
  }

  if (!person) {
    return <p className="text-sm text-destructive">Persona no encontrada.</p>;
  }

  return (
    <div className="space-y-6">
      <Link
        to="/personal"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a Personal
      </Link>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{person.fullName}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline">{PERSON_PROFILE_LABELS[person.profile]}</Badge>
            <span className="text-sm text-muted-foreground">
              {RELATIONSHIP_TYPE_LABELS[person.relationshipType]}
            </span>
          </div>
        </div>
        {!active && (
          <Button onClick={() => setIssueOpen(true)} size="sm">
            <ShieldCheck className="h-4 w-4 mr-2" />
            Emitir acreditación
          </Button>
        )}
      </div>

      <div className="rounded-lg border bg-card p-4 space-y-2 text-sm">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-muted-foreground text-xs">Email</p>
            <p>{person.email ?? '—'}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Teléfono</p>
            <p>{person.phone ?? '—'}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Cuenta ERP</p>
            <p>{person.user ? `${person.user.name} (${person.user.email})` : '— sin cuenta —'}</p>
          </div>
        </div>
        {person.notes && (
          <div>
            <p className="text-muted-foreground text-xs">Notas</p>
            <p>{person.notes}</p>
          </div>
        )}
      </div>

      {/* Acreditación vigente */}
      <div className="space-y-2">
        <h2 className="text-sm font-medium text-foreground">Acreditación</h2>
        {loadingAccreditations ? (
          <p className="text-sm text-muted-foreground">Cargando...</p>
        ) : !active ? (
          <p className="text-sm text-muted-foreground">
            Esta persona no tiene ninguna acreditación activa.
          </p>
        ) : (
          <div className="rounded-lg border bg-card p-4 flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[hsl(var(--success,142_71%_45%))]" />
                <span className="font-medium">{active.displayRole}</span>
                <Badge variant="default">ACTIVA</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Vigencia: {active.validFrom ? new Date(active.validFrom).toLocaleDateString() : 'sin inicio'}
                {' — '}
                {active.validUntil ? new Date(active.validUntil).toLocaleDateString() : 'sin vencimiento'}
              </p>
              <p className="text-xs text-muted-foreground">Emitida por {active.issuedBy.name}</p>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" onClick={() => setQrTarget(active)}>
                Ver QR
              </Button>
              <Button variant="outline" size="sm" onClick={() => setReissueOpen(true)}>
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                Reemitir
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => setRevokeTarget(active)}
              >
                <ShieldX className="h-3.5 w-3.5 mr-1.5" />
                Revocar
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Historial */}
      {history.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-medium text-foreground">Historial</h2>
          <div className="rounded-lg border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-muted-foreground text-xs uppercase tracking-wide">
                  <th className="px-4 py-2 text-left">Etiqueta</th>
                  <th className="px-4 py-2 text-left">Estado</th>
                  <th className="px-4 py-2 text-left">Revocada</th>
                  <th className="px-4 py-2 text-left">Motivo</th>
                </tr>
              </thead>
              <tbody>
                {history.map((a) => (
                  <tr key={a.id} className="border-b last:border-0">
                    <td className="px-4 py-2">{a.displayRole}</td>
                    <td className="px-4 py-2">
                      <Badge variant="destructive">REVOCADA</Badge>
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">
                      {a.revokedAt ? new Date(a.revokedAt).toLocaleString() : '—'}
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">{a.revokedReason ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Emitir */}
      <Dialog open={issueOpen} onOpenChange={setIssueOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Emitir acreditación</DialogTitle>
          </DialogHeader>
          <AccreditationFormFields form={issueForm} />
          {issueAccreditation.error && (
            <p className="text-xs text-destructive">{issueAccreditation.error.message}</p>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancelar</Button>
            </DialogClose>
            <Button
              onClick={issueForm.handleSubmit(handleIssue)}
              disabled={issueAccreditation.isPending}
            >
              {issueAccreditation.isPending ? 'Emitiendo...' : 'Emitir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reemitir */}
      <Dialog open={reissueOpen} onOpenChange={setReissueOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reemitir acreditación</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground">
            La acreditación actual quedará revocada y se emitirá una nueva con un código QR
            distinto. El historial se conserva.
          </p>
          <AccreditationFormFields form={reissueForm} />
          {reissueAccreditation.error && (
            <p className="text-xs text-destructive">{reissueAccreditation.error.message}</p>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancelar</Button>
            </DialogClose>
            <Button
              onClick={reissueForm.handleSubmit(handleReissue)}
              disabled={reissueAccreditation.isPending}
            >
              {reissueAccreditation.isPending ? 'Reemitiendo...' : 'Reemitir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revocar */}
      <Dialog open={!!revokeTarget} onOpenChange={(o) => { if (!o) setRevokeTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <ShieldX className="h-4 w-4" />
              Revocar acreditación
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            La verificación pública mostrará inmediatamente "NO VIGENTE". El carnet físico no se
            elimina, pero deja de ser válido al escanearlo.
          </p>
          <RevokeReasonField />
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={() => {
                if (!revokeTarget) return;
                const reasonInput = document.getElementById(
                  'revoke-reason',
                ) as HTMLInputElement | null;
                revokeAccreditation.mutate(
                  { id: revokeTarget.id, revokedReason: reasonInput?.value || undefined },
                  { onSuccess: () => setRevokeTarget(null) },
                );
              }}
              disabled={revokeAccreditation.isPending}
            >
              {revokeAccreditation.isPending ? 'Revocando...' : 'Revocar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QR */}
      <Dialog open={!!qrTarget} onOpenChange={(o) => { if (!o) setQrTarget(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Código QR — {qrTarget?.displayRole}</DialogTitle>
          </DialogHeader>
          {qrTarget && (
            <div className="flex flex-col items-center gap-4 py-2">
              <div className="p-3 rounded-lg border bg-white">
                <QRCodeCanvas
                  value={buildAccreditationPortalUrl(qrTarget.qrCode)}
                  size={200}
                  level="M"
                  marginSize={2}
                />
              </div>
              <p className="text-xs font-mono text-muted-foreground select-all text-center break-all">
                {buildAccreditationPortalUrl(qrTarget.qrCode)}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function RevokeReasonField() {
  return (
    <div className="space-y-1">
      <Label htmlFor="revoke-reason">Motivo (opcional, interno)</Label>
      <Input id="revoke-reason" placeholder="Ej. deja de prestar servicios" />
    </div>
  );
}

function AccreditationFormFields({ form }: { form: ReturnType<typeof useForm<AccreditationForm>> }) {
  const { register, formState } = form;
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <Label>Etiqueta pública</Label>
        <Input {...register('displayRole')} placeholder="Técnico" />
        <p className="text-xs text-muted-foreground">
          Es lo único que se muestra al escanear el QR — nunca el tipo de vínculo interno.
        </p>
        {formState.errors.displayRole && (
          <p className="text-xs text-destructive">{formState.errors.displayRole.message}</p>
        )}
      </div>
      <div className="space-y-1">
        <Label>Vigente desde (opcional)</Label>
        <Input {...register('validFrom')} type="date" />
      </div>
      <div className="space-y-1">
        <Label>Vigente hasta (opcional)</Label>
        <Input {...register('validUntil')} type="date" />
        <p className="text-xs text-muted-foreground">Dejar vacío para acreditación sin vencimiento.</p>
      </div>
    </div>
  );
}
