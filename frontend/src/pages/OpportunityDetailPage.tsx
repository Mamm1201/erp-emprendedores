import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm, useFieldArray, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { ArrowLeft, Pencil, Plus, Trash2 } from 'lucide-react';

import {
  useOpportunity,
  useUpdateOpportunity,
  useUpdateOpportunityStage,
  useLinkService,
  useUnlinkService,
  useGenerateQuotation,
  useQuotationsByOpportunity,
  type OpportunityFormData,
  type GenerateQuotationFormData,
} from '@/hooks/use-opportunities';
import { useContacts } from '@/hooks/use-contacts';
import { useActivities } from '@/hooks/use-activities';
import { useServices } from '@/hooks/use-services';
import type { Contact, Opportunity, OpportunityStage, QuotationStatus } from '@/lib/types';
import { LEAD_SOURCE_LABELS } from '@/pages/AccountsPage';
import {
  ActivityFormModal,
  OPPORTUNITY_PRIORITY_LABELS,
  OPPORTUNITY_STAGE_LABELS,
  OPPORTUNITY_STAGE_BADGE,
  ACTIVITY_TYPE_LABELS,
} from '@/pages/AccountDetailPage';
import { formatMoney } from '@/lib/money';
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

// Copia local mínima — el módulo de Quotations no se modifica, así que estos
// labels no se importan de QuotationsPage.tsx (no los exporta y no debemos
// tocar ese archivo). Solo se usan para la tarjeta resumen de esta sección.
const QUOTATION_STATUS_LABELS: Record<QuotationStatus, string> = {
  DRAFT: 'Borrador',
  SENT: 'Enviada',
  APPROVED: 'Aprobada',
  REJECTED: 'Rechazada',
  EXPIRED: 'Expirada',
  CONVERTED: 'Convertida',
  CANCELLED: 'Cancelada',
};

const QUOTATION_STATUS_BADGE: Record<QuotationStatus, 'secondary' | 'info' | 'success' | 'danger' | 'warning'> = {
  DRAFT: 'secondary',
  SENT: 'info',
  APPROVED: 'success',
  REJECTED: 'danger',
  EXPIRED: 'warning',
  CONVERTED: 'info',
  CANCELLED: 'danger',
};

// ─── OpportunityEditModal ─────────────────────────────────────────────────────

const opportunityEditSchema = z.object({
  title: z.string().min(1, 'El título es obligatorio').max(300),
  detectedNeed: z.string().max(4000).optional().or(z.literal('')),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  source: z.enum(['LINKEDIN', 'REFERRAL', 'INBOUND', 'EVENT', 'OTHER']),
  // string, no number — ver comentario equivalente en AccountDetailPage.tsx
  // (opportunitySchema): valueAsNumber en un input vacío produce NaN, que
  // z.number().optional() rechaza en vez de tratarlo como ausente.
  probability: z.string().optional().or(z.literal('')),
  potentialValue: z.string().optional().or(z.literal('')),
  primaryContactId: z.string().optional().or(z.literal('')),
});
type OpportunityEditSchema = z.infer<typeof opportunityEditSchema>;

function OpportunityEditModal({
  accountId, opportunity, contacts, open, onOpenChange,
}: {
  accountId: string;
  opportunity: Opportunity;
  contacts: Contact[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const updateOpportunity = useUpdateOpportunity(accountId);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<OpportunityEditSchema>({
    resolver: zodResolver(opportunityEditSchema),
  });

  useEffect(() => {
    if (!open) return;
    reset({
      title: opportunity.title,
      detectedNeed: opportunity.detectedNeed ?? '',
      priority: opportunity.priority,
      source: opportunity.source,
      probability: opportunity.probability != null ? String(opportunity.probability) : '',
      potentialValue: opportunity.potentialValue ?? '',
      primaryContactId: opportunity.primaryContactId ?? '',
    });
  }, [open, opportunity, reset]);

  async function onSubmit(values: OpportunityEditSchema) {
    const dto: Partial<OpportunityFormData> = {
      title: values.title,
      detectedNeed: values.detectedNeed || undefined,
      priority: values.priority,
      source: values.source,
      probability: values.probability ? Number(values.probability) : undefined,
      potentialValue: values.potentialValue ? Number(values.potentialValue) : undefined,
      primaryContactId: values.primaryContactId || undefined,
    };
    await updateOpportunity.mutateAsync({ id: opportunity.id, data: dto });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Editar Opportunity</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="edit-opp-title">Título *</Label>
            <Input id="edit-opp-title" {...register('title')} />
            {errors.title && <p className="text-xs text-[hsl(var(--destructive))]">{errors.title.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-opp-need">Necesidad detectada</Label>
            <Textarea id="edit-opp-need" {...register('detectedNeed')} rows={2} />
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
              <Label htmlFor="edit-opp-probability">Probabilidad (%)</Label>
              <Input id="edit-opp-probability" type="number" min={0} max={100}
                {...register('probability')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-opp-value">Valor potencial</Label>
              <Input id="edit-opp-value" type="number" min={0}
                {...register('potentialValue')} />
            </div>
          </div>
          {updateOpportunity.error && (
            <p className="text-sm text-[hsl(var(--destructive))]">{updateOpportunity.error.message}</p>
          )}
          <DialogFooter>
            <DialogClose asChild><Button type="button" variant="outline" disabled={updateOpportunity.isPending}>Cancelar</Button></DialogClose>
            <Button type="submit" disabled={updateOpportunity.isPending}>
              {updateOpportunity.isPending ? 'Guardando…' : 'Guardar cambios'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── StageSection ─────────────────────────────────────────────────────────────

function StageSection({ accountId, opportunity }: { accountId: string; opportunity: Opportunity }) {
  const updateStage = useUpdateOpportunityStage(accountId);
  const [nextStage, setNextStage] = useState<OpportunityStage | ''>('');

  // WON nunca se ofrece como destino manual — el backend lo rechaza siempre
  // (solo se alcanza automáticamente al aprobar la Quotation vinculada).
  // El resto de reglas de transición NO se duplican aquí: si el backend
  // rechaza la transición elegida, el error se muestra tal cual, inline.
  const options = (Object.keys(OPPORTUNITY_STAGE_LABELS) as OpportunityStage[])
    .filter((s) => s !== opportunity.stage && s !== 'WON');

  function handleChange() {
    if (!nextStage) return;
    updateStage.mutate(
      { id: opportunity.id, stage: nextStage },
      { onSuccess: () => setNextStage('') },
    );
  }

  return (
    <div className="rounded-lg border p-5 space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-sm font-semibold">Etapa</h2>
        <Badge variant={OPPORTUNITY_STAGE_BADGE[opportunity.stage]}>
          {OPPORTUNITY_STAGE_LABELS[opportunity.stage]}
        </Badge>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <select
          value={nextStage}
          onChange={(e) => setNextStage(e.target.value as OpportunityStage)}
          className={SELECT_CLASS + ' max-w-xs'}
        >
          <option value="">Cambiar a…</option>
          {options.map((s) => <option key={s} value={s}>{OPPORTUNITY_STAGE_LABELS[s]}</option>)}
        </select>
        <Button size="sm" variant="outline" disabled={!nextStage || updateStage.isPending} onClick={handleChange}>
          {updateStage.isPending ? 'Cambiando…' : 'Cambiar etapa'}
        </Button>
      </div>
      {updateStage.error && (
        <p className="text-sm text-[hsl(var(--destructive))]">{updateStage.error.message}</p>
      )}
    </div>
  );
}

// ─── ServicesSection ──────────────────────────────────────────────────────────

function ServicesSection({ accountId, opportunity }: { accountId: string; opportunity: Opportunity }) {
  const { data: services, isLoading, isError } = useServices();
  const linkService = useLinkService(accountId, opportunity.id);
  const unlinkService = useUnlinkService(accountId, opportunity.id);
  const linkedIds = new Set(opportunity.services.map((s) => s.id));
  const busy = linkService.isPending || unlinkService.isPending;

  function toggle(serviceId: string, linked: boolean) {
    if (linked) unlinkService.mutate(serviceId);
    else linkService.mutate(serviceId);
  }

  return (
    <div className="rounded-lg border p-5 space-y-3">
      <h2 className="text-sm font-semibold">Servicios</h2>
      {isLoading && <p className="text-xs text-[hsl(var(--muted-foreground))]">Cargando…</p>}
      {isError && <p className="text-xs text-[hsl(var(--destructive))]">Error al cargar el catálogo de servicios.</p>}
      {services && services.length > 0 && (
        <div className="space-y-2">
          {services.map((s) => {
            const linked = linkedIds.has(s.id);
            return (
              <label key={s.id} className="flex items-start gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={linked}
                  disabled={busy}
                  onChange={() => toggle(s.id, linked)}
                  className="mt-0.5 accent-[hsl(var(--primary))]"
                />
                <span>
                  <span className="font-medium">{s.name}</span>
                  {s.description && (
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">{s.description}</p>
                  )}
                </span>
              </label>
            );
          })}
        </div>
      )}
      {(linkService.error || unlinkService.error) && (
        <p className="text-sm text-[hsl(var(--destructive))]">
          {(linkService.error ?? unlinkService.error)?.message}
        </p>
      )}
    </div>
  );
}

// ─── ActivitiesSection ────────────────────────────────────────────────────────

function ActivitiesSection({
  accountId, opportunityId, contacts,
}: { accountId: string; opportunityId: string; contacts: Contact[] }) {
  const { data: activities, isLoading, isError } = useActivities(accountId);
  const [formOpen, setFormOpen] = useState(false);

  // Filtrado client-side (sin filtro server-side opportunityId — decisión
  // aceptada explícitamente en el contrato F1.9, ver useActivities).
  const filtered = (activities ?? []).filter((a) => a.opportunityId === opportunityId);

  return (
    <div className="rounded-lg border p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Actividades</h2>
        <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => setFormOpen(true)}>
          <Plus className="h-3 w-3" /> Registrar actividad
        </Button>
      </div>

      {isLoading && <p className="text-xs text-[hsl(var(--muted-foreground))]">Cargando…</p>}
      {isError && <p className="text-xs text-[hsl(var(--destructive))]">Error al cargar las actividades.</p>}
      {!isLoading && !isError && filtered.length === 0 && (
        <p className="text-xs text-[hsl(var(--muted-foreground))]">Sin actividades registradas para esta oportunidad.</p>
      )}

      {filtered.length > 0 && (
        <div className="divide-y divide-[hsl(var(--border)/0.5)]">
          {filtered.map((a) => (
            <div key={a.id} className="py-2.5 first:pt-0 last:pb-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                  {ACTIVITY_TYPE_LABELS[a.type]}
                </Badge>
                <span className="text-xs text-[hsl(var(--muted-foreground))]">
                  {format(parseISO(a.occurredAt), "d MMM yyyy, HH:mm", { locale: es })}
                </span>
              </div>
              <p className="text-sm mt-1">{a.summary}</p>
              {a.outcome && (
                <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">{a.outcome}</p>
              )}
            </div>
          ))}
        </div>
      )}

      <ActivityFormModal
        accountId={accountId}
        contacts={contacts}
        opportunityId={opportunityId}
        open={formOpen}
        onOpenChange={setFormOpen}
      />
    </div>
  );
}

// ─── GenerateQuotationDialog ──────────────────────────────────────────────────

const genItemSchema = z.object({
  description: z.string().min(1, 'Descripción requerida').max(500),
  quantity: z.number().min(0.001, 'Número requerido'),
  unitPrice: z.number().min(0, 'Número requerido'),
  discountAmount: z.number().min(0).optional().default(0),
  taxRate: z.number().min(0).max(100).optional().default(0),
});
const genFormSchema = z.object({
  validUntil: z.string().optional().or(z.literal('')),
  notes: z.string().max(5000).optional().or(z.literal('')),
  terms: z.string().max(5000).optional().or(z.literal('')),
  retentionsApplied: z.boolean().optional().default(false),
  items: z.array(genItemSchema).min(1, 'Agrega al menos un ítem'),
});
type GenFormSchema = z.infer<typeof genFormSchema>;
const DEFAULT_GEN_ITEM = { description: '', quantity: 1, unitPrice: 0, discountAmount: 0, taxRate: 0 };

function GenerateQuotationDialog({
  accountId, opportunityId, open, onOpenChange,
}: { accountId: string; opportunityId: string; open: boolean; onOpenChange: (open: boolean) => void }) {
  const generateQuotation = useGenerateQuotation(accountId, opportunityId);

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<GenFormSchema>({
    resolver: zodResolver(genFormSchema) as Resolver<GenFormSchema>,
    defaultValues: { validUntil: '', notes: '', terms: '', retentionsApplied: false, items: [DEFAULT_GEN_ITEM] },
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  useEffect(() => {
    if (!open) return;
    reset({ validUntil: '', notes: '', terms: '', retentionsApplied: false, items: [DEFAULT_GEN_ITEM] });
  }, [open, reset]);

  async function onSubmit(values: GenFormSchema) {
    const dto: GenerateQuotationFormData = {
      validUntil: values.validUntil || undefined,
      notes: values.notes || undefined,
      terms: values.terms || undefined,
      retentionsApplied: values.retentionsApplied ?? false,
      items: values.items.map((item, idx) => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discountAmount: item.discountAmount ?? 0,
        taxRate: item.taxRate ?? 0,
        lineOrder: idx,
      })),
    };
    await generateQuotation.mutateAsync(dto);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>Generar cotización</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Ítems</Label>
              <Button type="button" variant="outline" size="sm" className="h-7 text-xs gap-1"
                onClick={() => append(DEFAULT_GEN_ITEM)}>
                <Plus className="h-3 w-3" /> Agregar ítem
              </Button>
            </div>
            {errors.items?.root && (
              <p className="text-xs text-[hsl(var(--destructive))]">{errors.items.root.message}</p>
            )}
            <div className="space-y-2">
              {fields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-12 gap-2 items-start">
                  <div className="col-span-5">
                    <Input {...register(`items.${index}.description`)} placeholder="Descripción" className="h-8 text-xs" />
                    {errors.items?.[index]?.description && (
                      <p className="text-xs text-[hsl(var(--destructive))] mt-0.5">
                        {errors.items[index]?.description?.message}
                      </p>
                    )}
                  </div>
                  <div className="col-span-2">
                    <Input type="number" step="0.001" placeholder="Cant." className="h-8 text-xs text-right"
                      {...register(`items.${index}.quantity`, { valueAsNumber: true })} />
                  </div>
                  <div className="col-span-2">
                    <Input type="number" step="1" placeholder="Precio" className="h-8 text-xs text-right"
                      {...register(`items.${index}.unitPrice`, { valueAsNumber: true })} />
                  </div>
                  <div className="col-span-2">
                    <Input type="number" step="1" placeholder="Desc." className="h-8 text-xs text-right"
                      {...register(`items.${index}.discountAmount`, { valueAsNumber: true })} />
                  </div>
                  <div className="col-span-1 flex justify-end pt-1.5">
                    {fields.length > 1 && (
                      <button type="button" onClick={() => remove(index)}
                        className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--destructive))]">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Válida hasta</Label>
              <Input type="date" {...register('validUntil')} />
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer mt-6">
              <input type="checkbox" {...register('retentionsApplied')} className="accent-[hsl(var(--primary))]" />
              Aplicar retenciones (estimado)
            </label>
          </div>

          <div className="space-y-1.5">
            <Label>Notas</Label>
            <Textarea {...register('notes')} rows={2} />
          </div>

          {generateQuotation.error && (
            <p className="text-sm text-[hsl(var(--destructive))]">{generateQuotation.error.message}</p>
          )}

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={generateQuotation.isPending}>Cancelar</Button>
            </DialogClose>
            <Button type="submit" disabled={generateQuotation.isPending}>
              {generateQuotation.isPending ? 'Generando…' : 'Generar cotización'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── QuotationSection ─────────────────────────────────────────────────────────

function QuotationSection({ accountId, opportunityId }: { accountId: string; opportunityId: string }) {
  const navigate = useNavigate();
  const { data: quotations, isLoading, isError } = useQuotationsByOpportunity(opportunityId);
  const [genOpen, setGenOpen] = useState(false);
  const quotation = quotations?.[0];

  return (
    <div className="rounded-lg border p-5 space-y-3">
      <h2 className="text-sm font-semibold">Cotización</h2>

      {isLoading && <p className="text-xs text-[hsl(var(--muted-foreground))]">Cargando…</p>}
      {isError && <p className="text-xs text-[hsl(var(--destructive))]">Error al consultar la cotización.</p>}

      {!isLoading && !isError && !quotation && (
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-[hsl(var(--muted-foreground))]">
            Esta oportunidad todavía no tiene cotización.
          </p>
          <Button size="sm" onClick={() => setGenOpen(true)}>Generar cotización</Button>
        </div>
      )}

      {quotation && (
        <button
          onClick={() => navigate(`/cotizaciones/${quotation.id}`)}
          className="w-full text-left flex items-center justify-between gap-4 rounded-md border p-3 hover:bg-[hsl(var(--muted)/0.3)] transition-colors"
        >
          <div>
            <p className="text-sm font-medium font-mono">{quotation.number}</p>
            <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">{formatMoney(quotation.total)}</p>
          </div>
          <Badge variant={QUOTATION_STATUS_BADGE[quotation.status]}>
            {QUOTATION_STATUS_LABELS[quotation.status]}
          </Badge>
        </button>
      )}

      <GenerateQuotationDialog accountId={accountId} opportunityId={opportunityId} open={genOpen} onOpenChange={setGenOpen} />
    </div>
  );
}

// ─── OpportunityDetailPage ────────────────────────────────────────────────────

export function OpportunityDetailPage() {
  const { accountId, opportunityId } = useParams<{ accountId: string; opportunityId: string }>();
  const navigate = useNavigate();
  const [editOpen, setEditOpen] = useState(false);

  const { data: opportunity, isLoading, isError, refetch } = useOpportunity(accountId ?? null, opportunityId ?? null);
  const { data: contacts } = useContacts(accountId ?? null);

  if (isLoading) {
    return <div className="p-6 text-[hsl(var(--muted-foreground))]">Cargando…</div>;
  }

  if (isError || !opportunity || !accountId) {
    return (
      <div className="p-6 space-y-2">
        <p className="text-[hsl(var(--destructive))]">No se pudo cargar la oportunidad.</p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>Reintentar</Button>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/prospeccion/${accountId}`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold truncate">{opportunity.title}</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-0.5">
            {OPPORTUNITY_PRIORITY_LABELS[opportunity.priority]}
            {opportunity.primaryContact && ` · ${opportunity.primaryContact.name}`}
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-1" onClick={() => setEditOpen(true)}>
          <Pencil className="h-3.5 w-3.5" /> Editar
        </Button>
      </div>

      {/* Información */}
      <div className="rounded-lg border p-5 space-y-3">
        <h2 className="text-sm font-semibold">Información</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-[hsl(var(--muted-foreground))]">Probabilidad</p>
            <p>{opportunity.probability != null ? `${opportunity.probability}%` : '—'}</p>
          </div>
          <div>
            <p className="text-[hsl(var(--muted-foreground))]">Valor potencial</p>
            <p>{opportunity.potentialValue ? formatMoney(opportunity.potentialValue) : '—'}</p>
          </div>
          {opportunity.detectedNeed && (
            <div className="sm:col-span-2">
              <p className="text-[hsl(var(--muted-foreground))]">Necesidad detectada</p>
              <p>{opportunity.detectedNeed}</p>
            </div>
          )}
        </div>
      </div>

      <StageSection accountId={accountId} opportunity={opportunity} />
      <ServicesSection accountId={accountId} opportunity={opportunity} />
      <ActivitiesSection accountId={accountId} opportunityId={opportunity.id} contacts={contacts ?? []} />
      <QuotationSection accountId={accountId} opportunityId={opportunity.id} />

      <OpportunityEditModal
        accountId={accountId}
        opportunity={opportunity}
        contacts={contacts ?? []}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </div>
  );
}
