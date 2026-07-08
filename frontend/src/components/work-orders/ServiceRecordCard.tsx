import { useState } from 'react';
import { ClipboardCheck, Loader2, Plus, PenLine, CheckCircle2 } from 'lucide-react';

import type { ChecklistResult } from '@/lib/types';
import { FileAttachmentSection } from '@/components/shared/FileAttachmentSection';
import {
  useServiceRecord,
  useCreateServiceRecord,
  useUpdateServiceRecord,
  useUpdateChecklistItem,
  type UpdateServiceRecordData,
} from '@/hooks/use-service-records';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// ─── Checklist result config ──────────────────────────────────────────────────

const RESULT_OPTIONS: { value: ChecklistResult; label: string; classes: string }[] = [
  { value: 'OK',      label: 'OK',      classes: 'border-node-teal/30 bg-node-teal/10 text-node-teal data-[active=true]:bg-node-teal data-[active=true]:text-white data-[active=true]:border-node-teal' },
  { value: 'WARNING', label: 'Alerta',  classes: 'border-amber-signal/30 bg-amber-signal/10 text-amber-signal data-[active=true]:bg-amber-signal data-[active=true]:text-white data-[active=true]:border-amber-signal' },
  { value: 'FAIL',    label: 'Fallo',   classes: 'border-alert-red/30 bg-alert-red/10 text-alert-red data-[active=true]:bg-alert-red data-[active=true]:text-white data-[active=true]:border-alert-red' },
  { value: 'NA',      label: 'N/A',     classes: 'border-[hsl(var(--border))] bg-transparent text-[hsl(var(--muted-foreground))] data-[active=true]:bg-[hsl(var(--muted))] data-[active=true]:text-[hsl(var(--foreground))]' },
];

// ─── SaveableTextarea ─────────────────────────────────────────────────────────

function SaveableTextarea({
  label,
  initialValue,
  onSave,
  disabled,
}: {
  label: string;
  initialValue: string;
  onSave: (value: string) => Promise<void>;
  disabled?: boolean;
}) {
  const [value, setValue]     = useState(initialValue);
  const [dirty, setDirty]     = useState(false);
  const [saving, setSaving]   = useState(false);

  async function handleSave() {
    setSaving(true);
    await onSave(value);
    setDirty(false);
    setSaving(false);
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wide">
          {label}
        </p>
        {dirty && (
          <Button
            size="sm"
            variant="outline"
            className="h-6 text-xs px-2"
            onClick={handleSave}
            disabled={saving || disabled}
          >
            {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Guardar'}
          </Button>
        )}
      </div>
      <textarea
        className="w-full min-h-[80px] rounded-md border bg-transparent px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] disabled:opacity-50"
        value={value}
        onChange={(e) => { setValue(e.target.value); setDirty(true); }}
        disabled={disabled}
        placeholder={`Ingresa ${label.toLowerCase()}…`}
        rows={3}
      />
    </div>
  );
}

// ─── ChecklistRow ─────────────────────────────────────────────────────────────

function ChecklistRow({
  item,
  workOrderId,
}: {
  item: { id: string; description: string; result: ChecklistResult; notes: string | null };
  workOrderId: string;
}) {
  const updateItem = useUpdateChecklistItem();
  const pending    = updateItem.isPending;

  function setResult(result: ChecklistResult) {
    updateItem.mutate({ workOrderId, itemId: item.id, result });
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 py-2.5 border-b last:border-0">
      <p className="text-sm flex-1 min-w-0">{item.description}</p>
      <div className="flex gap-1 shrink-0">
        {RESULT_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            data-active={item.result === opt.value}
            disabled={pending}
            onClick={() => setResult(opt.value)}
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

// ─── Props ────────────────────────────────────────────────────────────────────

interface ServiceRecordCardProps {
  workOrderId: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ServiceRecordCard({ workOrderId }: ServiceRecordCardProps) {
  const { data: record, isLoading, isError, error } = useServiceRecord(workOrderId);
  const createRecord  = useCreateServiceRecord();
  const updateRecord  = useUpdateServiceRecord();

  // 404 means the record doesn't exist yet — any other error is a genuine failure
  const isNotFound = isError && (error as { status?: number } | null)?.status === 404;
  const isGenuineError = isError && !isNotFound;

  function handleCreate() {
    createRecord.mutate({ workOrderId, data: {} });
  }

  function saveField(field: keyof UpdateServiceRecordData) {
    return (value: string): Promise<void> =>
      updateRecord.mutateAsync({ workOrderId, data: { [field]: value || undefined } }).then(() => {});
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold uppercase tracking-wide text-[hsl(var(--muted-foreground))] flex items-center gap-1.5">
            <ClipboardCheck className="h-3.5 w-3.5" />
            Acta técnica
          </CardTitle>
        </div>
      </CardHeader>

      <CardContent>
        {/* Loading */}
        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))]">
            <Loader2 className="h-4 w-4 animate-spin" />
            Cargando acta…
          </div>
        )}

        {/* Genuine API error */}
        {isGenuineError && (
          <p className="text-sm text-[hsl(var(--destructive))]">
            Error al cargar el acta técnica. Intenta recargar la página.
          </p>
        )}

        {/* No record yet (404 or no data) */}
        {!isLoading && !isGenuineError && (isNotFound || !record) && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-1">
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              Aún no se ha generado el acta técnica de esta orden.
            </p>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 shrink-0"
              onClick={handleCreate}
              disabled={createRecord.isPending}
            >
              {createRecord.isPending
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <Plus className="h-3.5 w-3.5" />}
              Crear acta
            </Button>
          </div>
        )}

        {/* Record exists */}
        {record && (
          <div className="space-y-5">

            {/* Narrative fields */}
            <SaveableTextarea
              label="Hallazgos"
              initialValue={record.findings ?? ''}
              onSave={saveField('findings')}
            />
            <SaveableTextarea
              label="Actividades realizadas"
              initialValue={record.activitiesPerformed ?? ''}
              onSave={saveField('activitiesPerformed')}
            />
            <SaveableTextarea
              label="Recomendaciones"
              initialValue={record.recommendations ?? ''}
              onSave={saveField('recommendations')}
            />

            {/* Checklist */}
            {record.checklistItems.length > 0 && (
              <div>
                <p className="text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wide mb-2">
                  Checklist
                </p>
                <div className="divide-y rounded-md border px-4">
                  {record.checklistItems.map((item) => (
                    <ChecklistRow
                      key={item.id}
                      item={item}
                      workOrderId={workOrderId}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Signature status / action */}
            <div className="flex items-center justify-between gap-3 border rounded-md px-4 py-3">
              {record.clientSignedAt ? (
                <div className="flex items-center gap-2 text-node-teal text-sm">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>
                    Firmado por el cliente el{' '}
                    {new Date(record.clientSignedAt).toLocaleDateString('es-CO', {
                      day: 'numeric', month: 'long', year: 'numeric',
                    })}
                  </span>
                </div>
              ) : (
                <>
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">
                    El cliente aún no ha firmado el acta.
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 shrink-0 text-node-teal border-node-teal/30 hover:bg-node-teal/10"
                    onClick={() => updateRecord.mutate({ workOrderId, data: { clientSignedAt: new Date().toISOString() } })}
                    disabled={updateRecord.isPending}
                  >
                    {updateRecord.isPending
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : <PenLine className="h-3.5 w-3.5" />}
                    Marcar firma
                  </Button>
                </>
              )}
            </div>

            {/* Evidencias del acta */}
            <div className="border-t pt-4 mt-2">
              <FileAttachmentSection
                entityType="SERVICE_RECORD"
                entityId={record.id}
                label="Evidencias del acta"
                defaultCategory="PHOTO"
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
