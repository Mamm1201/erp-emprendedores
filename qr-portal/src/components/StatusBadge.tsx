import type { PortalState } from '../api/types';

interface Props {
  state: PortalState;
}

const CONFIG: Record<PortalState, { label: string; className: string; dot: boolean }> = {
  active:           { label: 'ACTIVO',            className: 'active',     dot: true },
  offline:          { label: 'FUERA DE SERVICIO', className: 'offline',    dot: true },
  decommissioned:   { label: 'DADO DE BAJA',      className: 'retired',    dot: false },
  contract_expired: { label: 'SIN SEGUIMIENTO',   className: 'no-history', dot: false },
};

export function StatusBadge({ state }: Props) {
  const { label, className, dot } = CONFIG[state];
  return (
    <span className={`status-badge ${className}`} role="status" aria-label={`Estado: ${label}`}>
      {dot && <span className="status-badge-dot" aria-hidden="true" />}
      {label}
    </span>
  );
}
