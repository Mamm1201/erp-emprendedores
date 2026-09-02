import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Pencil, Plus } from 'lucide-react';

import { useAccount } from '@/hooks/use-accounts';
import { useContacts, useCreateContact, type ContactFormData } from '@/hooks/use-contacts';
import { useOpportunities, useCreateOpportunity, type OpportunityFormData } from '@/hooks/use-opportunities';
import { useCreateActivity, type ActivityFormData } from '@/hooks/use-activities';
import type { Contact, Opportunity } from '@/lib/types';
import {
  AccountFormModal,
  INSTITUTION_TYPE_LABELS,
  ACCOUNT_STATUS_LABELS,
  ACCOUNT_STATUS_BADGE,
  LEAD_SOURCE_LABELS,
} from '@/pages/AccountsPage';
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

const SELECT_CLASS =
  'flex h-9 w-full rounded-md border border-[hsl(var(--input))] bg-transparent px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] disabled:opacity-50';

export const CONTACT_ROLE_LABELS: Record<string, string> = {
  IPS_MANAGER: 'Gerente IPS',
  ADMIN_DIRECTOR: 'Director administrativo',
  INFRASTRUCTURE_DIRECTOR: 'Director de infraestructura',
  MAINTENANCE_COORDINATOR: 'Coordinador de mantenimiento',
  HOSPITAL_ENGINEERING: 'Ingeniería hospitalaria',
  BIOMEDICAL_MANAGER: 'Jefe biomédico',
  PROCUREMENT: 'Compras',
  QUALITY_COMPLIANCE: 'Calidad / cumplimiento',
  OTHER: 'Otro',
};

export const INFLUENCE_LEVEL_LABELS: Record<string, string> = {
  DECISION_MAKER: 'Decisor',
  INFLUENCER: 'Influenciador',
  GATEKEEPER: 'Filtro de acceso',
  UNKNOWN: 'Sin definir',
};

export const OPPORTUNITY_PRIORITY_LABELS: Record<string, string> = {
  LOW: 'Baja',
  MEDIUM: 'Media',
  HIGH: 'Alta',
  CRITICAL: 'Crítica',
};

export const OPPORTUNITY_STAGE_LABELS: Record<string, string> = {
  IDENTIFIED: 'Identificada',
  RESEARCHING: 'Investigando',
  CONTACTED: 'Contactada',
  CONVERSING: 'En conversación',
  MEETING_DIAGNOSIS: 'Reunión / diagnóstico',
  QUOTED: 'Cotizada',
  NEGOTIATING: 'Negociando',
  WON: 'Ganada',
  LOST: 'Perdida',
};

export const OPPORTUNITY_STAGE_BADGE: Record<string, 'secondary' | 'info' | 'success' | 'danger' | 'warning'> = {
  IDENTIFIED: 'secondary',
  RESEARCHING: 'secondary',
  CONTACTED: 'info',
  CONVERSING: 'info',
  MEETING_DIAGNOSIS: 'info',
  QUOTED: 'warning',
  NEGOTIATING: 'warning',
  WON: 'success',
  LOST: 'danger',
};

export const ACTIVITY_TYPE_LABELS: Record<string, string> = {
  LINKEDIN: 'LinkedIn',
  EMAIL: 'Email',
  WHATSAPP: 'WhatsApp',
  CALL: 'Llamada',
  MEETING: 'Reunión',
  NOTE: 'Nota',
  PROPOSAL: 'Propuesta',
  FOLLOW_UP: 'Seguimiento',
};

// ─── ContactFormModal ─────────────────────────────────────────────────────────

const contactSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio').max(200),
  role: z.enum([
    'IPS_MANAGER', 'ADMIN_DIRECTOR', 'INFRASTRUCTURE_DIRECTOR', 'MAINTENANCE_COORDINATOR',
    'HOSPITAL_ENGINEERING', 'BIOMEDICAL_MANAGER', 'PROCUREMENT', 'QUALITY_COMPLIANCE', 'OTHER',
  ]),
  influenceLevel: z.enum(['DECISION_MAKER', 'INFLUENCER', 'GATEKEEPER', 'UNKNOWN']).optional(),
  area: z.string().max(150).optional().or(z.literal('')),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().max(50).optional().or(z.literal('')),
  linkedinUrl: z.string().max(300).optional().or(z.literal('')),
  notes: z.string().max(2000).optional().or(z.literal('')),
});
type ContactSchema = z.infer<typeof contactSchema>;

function ContactFormModal({
  accountId, open, onOpenChange,
}: { accountId: string; open: boolean; onOpenChange: (open: boolean) => void }) {
  const createContact = useCreateContact(accountId);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<ContactSchema>({
    resolver: zodResolver(contactSchema),
  });

  useEffect(() => {
    if (!open) return;
    reset({ name: '', role: 'OTHER', influenceLevel: 'UNKNOWN', area: '', email: '', phone: '', linkedinUrl: '', notes: '' });
  }, [open, reset]);

  async function onSubmit(values: ContactSchema) {
    const dto: ContactFormData = {
      name: values.name,
      role: values.role,
      influenceLevel: values.influenceLevel,
      area: values.area || undefined,
      email: values.email || undefined,
      phone: values.phone || undefined,
      linkedinUrl: values.linkedinUrl || undefined,
      notes: values.notes || undefined,
    };
    await createContact.mutateAsync(dto);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Nuevo Contact</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="contact-name">Nombre *</Label>
            <Input id="contact-name" {...register('name')} placeholder="Laura Gómez" />
            {errors.name && <p className="text-xs text-[hsl(var(--destructive))]">{errors.name.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Rol</Label>
              <select {...register('role')} className={SELECT_CLASS}>
                {Object.entries(CONTACT_ROLE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Influencia</Label>
              <select {...register('influenceLevel')} className={SELECT_CLASS}>
                {Object.entries(INFLUENCE_LEVEL_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="contact-area">Área</Label>
            <Input id="contact-area" {...register('area')} placeholder="Mantenimiento" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="contact-email">Email</Label>
              <Input id="contact-email" type="email" {...register('email')} />
              {errors.email && <p className="text-xs text-[hsl(var(--destructive))]">{errors.email.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contact-phone">Teléfono</Label>
              <Input id="contact-phone" {...register('phone')} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="contact-linkedin">LinkedIn</Label>
            <Input id="contact-linkedin" {...register('linkedinUrl')} placeholder="https://linkedin.com/in/…" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="contact-notes">Notas</Label>
            <Textarea id="contact-notes" {...register('notes')} rows={2} />
          </div>
          {createContact.error && (
            <p className="text-sm text-[hsl(var(--destructive))]">{createContact.error.message}</p>
          )}
          <DialogFooter>
            <DialogClose asChild><Button type="button" variant="outline" disabled={createContact.isPending}>Cancelar</Button></DialogClose>
            <Button type="submit" disabled={createContact.isPending}>
              {createContact.isPending ? 'Guardando…' : 'Crear contact'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── ContactsSection ──────────────────────────────────────────────────────────

function ContactsSection({ accountId }: { accountId: string }) {
  const { data: contacts, isLoading, isError } = useContacts(accountId);
  const [formOpen, setFormOpen] = useState(false);

  return (
    <div className="rounded-lg border p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Contacts</h2>
        <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => setFormOpen(true)}>
          <Plus className="h-3 w-3" /> Nuevo Contact
        </Button>
      </div>

      {isLoading && <p className="text-xs text-[hsl(var(--muted-foreground))]">Cargando…</p>}
      {isError && <p className="text-xs text-[hsl(var(--destructive))]">Error al cargar los contacts.</p>}
      {!isLoading && !isError && contacts?.length === 0 && (
        <p className="text-xs text-[hsl(var(--muted-foreground))]">Esta cuenta no tiene contacts registrados.</p>
      )}

      {contacts && contacts.length > 0 && (
        <div className="divide-y divide-[hsl(var(--border)/0.5)]">
          {contacts.map((c: Contact) => (
            <div key={c.id} className="py-2.5 first:pt-0 last:pb-0 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium">{c.name}</p>
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                    {INFLUENCE_LEVEL_LABELS[c.influenceLevel]}
                  </Badge>
                </div>
                <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
                  {CONTACT_ROLE_LABELS[c.role]}
                  {c.email && ` · ${c.email}`}
                  {c.phone && ` · ${c.phone}`}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <ContactFormModal accountId={accountId} open={formOpen} onOpenChange={setFormOpen} />
    </div>
  );
}

// ─── OpportunityFormModal ─────────────────────────────────────────────────────

const opportunitySchema = z.object({
  title: z.string().min(1, 'El título es obligatorio').max(300),
  detectedNeed: z.string().max(4000).optional().or(z.literal('')),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  source: z.enum(['LINKEDIN', 'REFERRAL', 'INBOUND', 'EVENT', 'OTHER']),
  // string, no number: con valueAsNumber, un input vacio produce NaN, y
  // z.number().optional() NO trata NaN como ausente (rechaza el submit
  // silenciosamente). Se valida como string opcional y se convierte en
  // onSubmit, igual que el resto de campos opcionales de este formulario.
  probability: z.string().optional().or(z.literal('')),
  potentialValue: z.string().optional().or(z.literal('')),
  primaryContactId: z.string().optional().or(z.literal('')),
});
type OpportunitySchema = z.infer<typeof opportunitySchema>;

function OpportunityFormModal({
  accountId, contacts, open, onOpenChange,
}: { accountId: string; contacts: Contact[]; open: boolean; onOpenChange: (open: boolean) => void }) {
  const createOpportunity = useCreateOpportunity(accountId);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<OpportunitySchema>({
    resolver: zodResolver(opportunitySchema),
  });

  useEffect(() => {
    if (!open) return;
    reset({ title: '', detectedNeed: '', priority: 'MEDIUM', source: 'REFERRAL', primaryContactId: '' });
  }, [open, reset]);

  async function onSubmit(values: OpportunitySchema) {
    const dto: OpportunityFormData = {
      title: values.title,
      detectedNeed: values.detectedNeed || undefined,
      priority: values.priority,
      source: values.source,
      probability: values.probability ? Number(values.probability) : undefined,
      potentialValue: values.potentialValue ? Number(values.potentialValue) : undefined,
      primaryContactId: values.primaryContactId || undefined,
    };
    await createOpportunity.mutateAsync(dto);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Nueva Opportunity</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="opp-title">Título *</Label>
            <Input id="opp-title" {...register('title')} placeholder="Mantenimiento biomédico anual" />
            {errors.title && <p className="text-xs text-[hsl(var(--destructive))]">{errors.title.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="opp-need">Necesidad detectada</Label>
            <Textarea id="opp-need" {...register('detectedNeed')} rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Prioridad</Label>
              <select {...register('priority')} className={SELECT_CLASS}>
                {Object.entries(OPPORTUNITY_PRIORITY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Origen *</Label>
              <select {...register('source')} className={SELECT_CLASS}>
                {Object.entries(LEAD_SOURCE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Contacto principal</Label>
            <select {...register('primaryContactId')} className={SELECT_CLASS}>
              <option value="">Sin definir</option>
              {contacts.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="opp-probability">Probabilidad (%)</Label>
              <Input id="opp-probability" type="number" min={0} max={100}
                {...register('probability')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="opp-value">Valor potencial</Label>
              <Input id="opp-value" type="number" min={0}
                {...register('potentialValue')} />
            </div>
          </div>
          {createOpportunity.error && (
            <p className="text-sm text-[hsl(var(--destructive))]">{createOpportunity.error.message}</p>
          )}
          <DialogFooter>
            <DialogClose asChild><Button type="button" variant="outline" disabled={createOpportunity.isPending}>Cancelar</Button></DialogClose>
            <Button type="submit" disabled={createOpportunity.isPending}>
              {createOpportunity.isPending ? 'Guardando…' : 'Crear Opportunity'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── OpportunitiesSection ─────────────────────────────────────────────────────

function OpportunitiesSection({ accountId, contacts }: { accountId: string; contacts: Contact[] }) {
  const navigate = useNavigate();
  const { data: opportunities, isLoading, isError } = useOpportunities(accountId);
  const [formOpen, setFormOpen] = useState(false);

  return (
    <div className="rounded-lg border p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Opportunities</h2>
        <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => setFormOpen(true)}>
          <Plus className="h-3 w-3" /> Nueva Opportunity
        </Button>
      </div>

      {isLoading && <p className="text-xs text-[hsl(var(--muted-foreground))]">Cargando…</p>}
      {isError && <p className="text-xs text-[hsl(var(--destructive))]">Error al cargar las opportunities.</p>}
      {!isLoading && !isError && opportunities?.length === 0 && (
        <p className="text-xs text-[hsl(var(--muted-foreground))]">Esta cuenta no tiene opportunities registradas.</p>
      )}

      {opportunities && opportunities.length > 0 && (
        <div className="divide-y divide-[hsl(var(--border)/0.5)]">
          {opportunities.map((o: Opportunity) => (
            <button
              key={o.id}
              onClick={() => navigate(`/prospeccion/${accountId}/oportunidades/${o.id}`)}
              className="w-full text-left py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-4 hover:bg-[hsl(var(--muted)/0.3)] transition-colors rounded px-1"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{o.title}</p>
                <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
                  {OPPORTUNITY_PRIORITY_LABELS[o.priority]}
                  {o.potentialValue && ` · ${o.potentialValue}`}
                </p>
              </div>
              <Badge variant={OPPORTUNITY_STAGE_BADGE[o.stage]} className="shrink-0">
                {OPPORTUNITY_STAGE_LABELS[o.stage]}
              </Badge>
            </button>
          ))}
        </div>
      )}

      <OpportunityFormModal accountId={accountId} contacts={contacts} open={formOpen} onOpenChange={setFormOpen} />
    </div>
  );
}

// ─── ActivityFormModal (exportado — reutilizado desde OpportunityDetailPage) ──

const activitySchema = z.object({
  type: z.enum(['LINKEDIN', 'EMAIL', 'WHATSAPP', 'CALL', 'MEETING', 'NOTE', 'PROPOSAL', 'FOLLOW_UP']),
  occurredAt: z.string().min(1, 'La fecha es obligatoria'),
  summary: z.string().min(1, 'El resumen es obligatorio').max(2000),
  outcome: z.string().max(2000).optional().or(z.literal('')),
  contactId: z.string().optional().or(z.literal('')),
});
type ActivitySchema = z.infer<typeof activitySchema>;

export interface ActivityFormModalProps {
  accountId: string;
  contacts: Contact[];
  // undefined => Activity general de la Account, sin Opportunity.
  // string    => Activity asociada a esa Opportunity (F1.9, sección Activities).
  opportunityId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ActivityFormModal({
  accountId, contacts, opportunityId, open, onOpenChange,
}: ActivityFormModalProps) {
  const createActivity = useCreateActivity(accountId);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<ActivitySchema>({
    resolver: zodResolver(activitySchema),
  });

  useEffect(() => {
    if (!open) return;
    reset({
      type: 'NOTE',
      occurredAt: new Date().toISOString().slice(0, 16),
      summary: '',
      outcome: '',
      contactId: '',
    });
  }, [open, reset]);

  async function onSubmit(values: ActivitySchema) {
    const dto: ActivityFormData = {
      type: values.type,
      occurredAt: new Date(values.occurredAt).toISOString(),
      summary: values.summary,
      outcome: values.outcome || undefined,
      contactId: values.contactId || undefined,
      opportunityId,
    };
    await createActivity.mutateAsync(dto);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Registrar actividad</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Tipo *</Label>
              <select {...register('type')} className={SELECT_CLASS}>
                {Object.entries(ACTIVITY_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="act-occurredAt">Fecha *</Label>
              <Input id="act-occurredAt" type="datetime-local" {...register('occurredAt')} />
              {errors.occurredAt && <p className="text-xs text-[hsl(var(--destructive))]">{errors.occurredAt.message}</p>}
            </div>
          </div>
          {contacts.length > 0 && (
            <div className="space-y-1.5">
              <Label>Contacto</Label>
              <select {...register('contactId')} className={SELECT_CLASS}>
                <option value="">Sin definir</option>
                {contacts.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="act-summary">Resumen *</Label>
            <Textarea id="act-summary" {...register('summary')} rows={2} placeholder="Llamada inicial, confirmó interés…" />
            {errors.summary && <p className="text-xs text-[hsl(var(--destructive))]">{errors.summary.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="act-outcome">Resultado</Label>
            <Textarea id="act-outcome" {...register('outcome')} rows={2} placeholder="Solicitó cotización formal…" />
          </div>
          {createActivity.error && (
            <p className="text-sm text-[hsl(var(--destructive))]">{createActivity.error.message}</p>
          )}
          <DialogFooter>
            <DialogClose asChild><Button type="button" variant="outline" disabled={createActivity.isPending}>Cancelar</Button></DialogClose>
            <Button type="submit" disabled={createActivity.isPending}>
              {createActivity.isPending ? 'Guardando…' : 'Registrar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── AccountDetailPage ────────────────────────────────────────────────────────

export function AccountDetailPage() {
  const { accountId } = useParams<{ accountId: string }>();
  const navigate = useNavigate();
  const [editOpen, setEditOpen] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);

  const { data: account, isLoading, isError, refetch } = useAccount(accountId ?? null);
  const { data: contacts } = useContacts(accountId ?? null);

  if (isLoading) {
    return <div className="p-6 text-[hsl(var(--muted-foreground))]">Cargando…</div>;
  }

  if (isError || !account) {
    return (
      <div className="p-6 space-y-2">
        <p className="text-[hsl(var(--destructive))]">No se pudo cargar la cuenta.</p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>Reintentar</Button>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/prospeccion')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold">{account.legalName}</h1>
            <Badge variant={ACCOUNT_STATUS_BADGE[account.status]}>
              {ACCOUNT_STATUS_LABELS[account.status]}
            </Badge>
          </div>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-0.5">
            {INSTITUTION_TYPE_LABELS[account.institutionType]} · {account.city}
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-1" onClick={() => setEditOpen(true)}>
          <Pencil className="h-3.5 w-3.5" /> Editar
        </Button>
      </div>

      {/* Identidad */}
      <div className="rounded-lg border p-5 space-y-3">
        <h2 className="text-sm font-semibold">Información</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-[hsl(var(--muted-foreground))]">NIT</p>
            <p className="font-mono">{account.nit ?? '—'}</p>
          </div>
          <div>
            <p className="text-[hsl(var(--muted-foreground))]">Origen</p>
            <p>{LEAD_SOURCE_LABELS[account.source]}</p>
          </div>
          <div>
            <p className="text-[hsl(var(--muted-foreground))]">Responsable</p>
            <p>{account.owner.name}</p>
          </div>
          {account.notes && (
            <div className="sm:col-span-2">
              <p className="text-[hsl(var(--muted-foreground))]">Notas</p>
              <p>{account.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Actividad general */}
      <div className="flex justify-end">
        <Button variant="outline" size="sm" className="gap-1" onClick={() => setActivityOpen(true)}>
          <Plus className="h-3.5 w-3.5" /> Registrar actividad
        </Button>
      </div>

      <ContactsSection accountId={account.id} />
      <OpportunitiesSection accountId={account.id} contacts={contacts ?? []} />

      <AccountFormModal open={editOpen} onOpenChange={setEditOpen} editing={account} />
      <ActivityFormModal
        accountId={account.id}
        contacts={contacts ?? []}
        open={activityOpen}
        onOpenChange={setActivityOpen}
      />
    </div>
  );
}
