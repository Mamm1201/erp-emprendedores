import { useState, type ReactNode } from 'react';
import { Trash2 } from 'lucide-react';
import type { AssociatedEquipment, Equipment, EquipmentType } from '@/lib/types';
import { Button } from '@/components/ui/button';

const SELECT_CLASS =
  'flex h-9 w-full rounded-md border border-[hsl(var(--input))] bg-transparent px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] disabled:opacity-50';

const EQUIPMENT_TYPE_LABEL: Record<string, string> = {
  NURSE_CALL: 'Llamado de enfermería',
  MEDICAL_ALERT: 'Alerta médica',
  GENERATOR: 'Generador',
  UPS: 'UPS',
  ELECTRICAL: 'Eléctrico',
  OTHER: 'Otro',
};

function equipmentLabel(eq: Equipment | AssociatedEquipment['equipment']): string {
  const type = EQUIPMENT_TYPE_LABEL[eq.type as EquipmentType] ?? eq.type;
  const detail = [eq.brand, eq.model].filter(Boolean).join(' ');
  const sn = eq.serialNumber ? `S/N ${eq.serialNumber}` : null;
  return [type, detail, sn].filter(Boolean).join(' · ');
}

interface EquipmentAssociationPanelProps {
  title: string;
  associated: AssociatedEquipment[];
  availableEquipment: Equipment[];
  isLoading: boolean;
  isAttaching: boolean;
  isDetaching: boolean;
  onAttach: (equipmentId: string) => void;
  onDetach: (equipmentId: string) => void;
  emptyAssociatedMessage?: string;
  emptyAvailableMessage?: string;
  extraControls?: ReactNode;
}

export function EquipmentAssociationPanel({
  title,
  associated,
  availableEquipment,
  isLoading,
  isAttaching,
  isDetaching,
  onAttach,
  onDetach,
  emptyAssociatedMessage = 'Sin equipos asociados',
  emptyAvailableMessage = 'No hay equipos disponibles para asociar',
  extraControls,
}: EquipmentAssociationPanelProps) {
  const [selectedId, setSelectedId] = useState('');

  function handleAttach() {
    if (!selectedId) return;
    onAttach(selectedId);
    setSelectedId('');
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium">{title}</h3>

      {isLoading ? (
        <p className="text-sm text-[hsl(var(--muted-foreground))]">Cargando…</p>
      ) : associated.length === 0 ? (
        <p className="text-sm text-[hsl(var(--muted-foreground))]">{emptyAssociatedMessage}</p>
      ) : (
        <ul className="space-y-1.5">
          {associated.map((a) => (
            <li
              key={a.equipmentId}
              className="flex items-center justify-between gap-2 rounded-md border border-[hsl(var(--border))] px-3 py-2 text-sm"
            >
              <span>
                {equipmentLabel(a.equipment)}
                <span className="text-[hsl(var(--muted-foreground))]"> — {a.equipment.branch.name}</span>
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={isDetaching}
                onClick={() => onDetach(a.equipmentId)}
                aria-label="Quitar equipo"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      {extraControls}

      <div className="flex items-center gap-2">
        <select
          className={SELECT_CLASS}
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          disabled={availableEquipment.length === 0}
        >
          <option value="">
            {availableEquipment.length === 0 ? emptyAvailableMessage : 'Seleccionar equipo…'}
          </option>
          {availableEquipment.map((eq) => (
            <option key={eq.id} value={eq.id}>
              {equipmentLabel(eq)}
            </option>
          ))}
        </select>
        <Button
          type="button"
          variant="outline"
          disabled={!selectedId || isAttaching}
          onClick={handleAttach}
        >
          Agregar
        </Button>
      </div>
    </div>
  );
}
