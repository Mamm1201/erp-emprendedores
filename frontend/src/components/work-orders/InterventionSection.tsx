import type { Intervention, ChecklistResult } from '@/lib/types';
import { useUpdateIntervention, useUpdateChecklistItem } from '@/hooks/use-service-records';
import { useTechnicians } from '@/hooks/use-users';
import { SaveableTextarea } from '@/components/shared/SaveableTextarea';
import { FileAttachmentSection } from '@/components/shared/FileAttachmentSection';
import { cn } from '@/lib/utils';

const SELECT_CLASS =
  'flex h-9 w-full rounded-md border border-[hsl(var(--input))] bg-transparent px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]';

const EQUIPMENT_TYPE_LABEL: Record<string, string> = {
  NURSE_CALL: 'Llamado de enfermería',
  MEDICAL_ALERT: 'Alerta médica',
  GENERATOR: 'Generador',
  UPS: 'UPS',
  ELECTRICAL: 'Eléctrico',
  OTHER: 'Otro',
};

export function equipmentLabel(eq: Intervention['equipment']): string {
  const type = EQUIPMENT_TYPE_LABEL[eq.type] ?? eq.type;
  const detail = [eq.brand, eq.model].filter(Boolean).join(' ');
  const sn = eq.serialNumber ? `S/N ${eq.serialNumber}` : null;
  return [type, detail, sn].filter(Boolean).join(' · ');
}

const RESULT_OPTIONS: { value: ChecklistResult; label: string; classes: string }[] = [
  { value: 'OK',      label: 'OK',      classes: 'border-node-teal/30 bg-node-teal/10 text-node-teal data-[active=true]:bg-node-teal data-[active=true]:text-white data-[active=true]:border-node-teal' },
  { value: 'WARNING', label: 'Alerta',  classes: 'border-amber-signal/30 bg-amber-signal/10 text-amber-signal data-[active=true]:bg-amber-signal data-[active=true]:text-white data-[active=true]:border-amber-signal' },
  { value: 'FAIL',    label: 'Fallo',   classes: 'border-alert-red/30 bg-alert-red/10 text-alert-red data-[active=true]:bg-alert-red data-[active=true]:text-white data-[active=true]:border-alert-red' },
  { value: 'NA',      label: 'N/A',     classes: 'border-[hsl(var(--border))] bg-transparent text-[hsl(var(--muted-foreground))] data-[active=true]:bg-[hsl(var(--muted))] data-[active=true]:text-[hsl(var(--foreground))]' },
];

function ChecklistRow({
  item,
  workOrderId,
}: {
  item: { id: string; description: string; result: ChecklistResult; notes: string | null };
  workOrderId: string;
}) {
  const updateItem = useUpdateChecklistItem();
  const pending    = updateItem.isPending;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 py-2.5 border-b last:border-0">
      <p className="text-sm flex-1 min-w-0">{item.description}</p>
      <div className="flex gap-1 shrink-0">
        {RESULT_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            data-active={item.result === opt.value}
            disabled={pending}
            onClick={() => updateItem.mutate({ workOrderId, itemId: item.id, result: opt.value })}
            className={cn(
              'px-2 py-0.5 rounded border text-xs font-medium transition-colors disabled:opacity-50',
              opt.classes,
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// Bloque de un equipo realmente intervenido: encabezado del equipo, informe
// tecnico editable en linea y su propio checklist. Usado tanto en el detalle
// de la OT (ServiceRecordCard) como en el modal "Ver acta" (ServiceRecordsPage)
// — una sola implementacion para no duplicar la logica de edicion.
export function InterventionSection({
  intervention,
  workOrderId,
}: {
  intervention: Intervention;
  workOrderId: string;
}) {
  const updateIntervention = useUpdateIntervention();
  const { data: technicians = [] } = useTechnicians();

  function saveField(field: 'findings' | 'activitiesPerformed' | 'recommendations') {
    return (value: string): Promise<void> =>
      updateIntervention
        .mutateAsync({ workOrderId, interventionId: intervention.id, data: { [field]: value || undefined } })
        .then(() => {});
  }

  function saveTechnician(technicianId: string) {
    updateIntervention.mutate({
      workOrderId,
      interventionId: intervention.id,
      data: { primaryTechnicianId: technicianId || undefined },
    });
  }

  return (
    <div className="rounded-md border p-4 space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm font-semibold">{equipmentLabel(intervention.equipment)}</p>
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wide">
            Técnico
          </label>
          <select
            value={intervention.primaryTechnicianId ?? ''}
            onChange={(e) => saveTechnician(e.target.value)}
            disabled={updateIntervention.isPending}
            className={cn(SELECT_CLASS, 'h-7 w-auto text-xs')}
          >
            <option value="">Sin asignar</option>
            {technicians.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
      </div>

      <SaveableTextarea label="Hallazgos" initialValue={intervention.findings ?? ''} onSave={saveField('findings')} />
      <SaveableTextarea label="Actividades realizadas" initialValue={intervention.activitiesPerformed ?? ''} onSave={saveField('activitiesPerformed')} />
      <SaveableTextarea label="Recomendaciones" initialValue={intervention.recommendations ?? ''} onSave={saveField('recommendations')} />

      {intervention.checklistItems.length > 0 && (
        <div>
          <p className="text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wide mb-2">
            Checklist
          </p>
          <div className="divide-y rounded-md border px-4">
            {intervention.checklistItems.map((item) => (
              <ChecklistRow key={item.id} item={item} workOrderId={workOrderId} />
            ))}
          </div>
        </div>
      )}

      <div className="border-t pt-3">
        <FileAttachmentSection
          entityType="INTERVENTION"
          entityId={intervention.id}
          label="Evidencia de este equipo"
          defaultCategory="PHOTO"
        />
      </div>
    </div>
  );
}
