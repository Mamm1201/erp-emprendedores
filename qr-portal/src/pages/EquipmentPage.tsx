import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { fetchEquipment, NotFoundError, NetworkError } from '../api/client';
import type { EquipmentPublicDto, PortalState } from '../api/types';
import { derivePortalState } from '../api/types';
import { PortalHeader } from '../components/PortalHeader';
import { PortalFooter } from '../components/PortalFooter';
import { StatusBadge } from '../components/StatusBadge';
import { AlertBanner } from '../components/AlertBanner';
import { SectionBlock } from '../components/SectionBlock';
import { ContactCard } from '../components/ContactCard';
import { NotFoundPage } from './NotFoundPage';

const MAINTENANCE_TYPE_LABEL: Record<string, string> = {
  PREVENTIVE: 'Mantenimiento preventivo',
  CORRECTIVE:  'Mantenimiento correctivo',
};

const TYPE_LABEL: Record<string, string> = {
  NURSE_CALL:    'Llamado de enfermería',
  MEDICAL_ALERT: 'Alerta médica',
  GENERATOR:     'Generador',
  UPS:           'UPS',
  ELECTRICAL:    'Eléctrico',
  OTHER:         'Otro',
};

const fmt = new Intl.DateTimeFormat('es-CO', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  timeZone: 'UTC',
});

function formatDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  try { return fmt.format(new Date(iso)); }
  catch { return iso; }
}

function buildEquipmentName(eq: EquipmentPublicDto): string {
  const type = TYPE_LABEL[eq.type] ?? eq.type;
  if (eq.brand && eq.model) return `${type} ${eq.model}`;
  if (eq.brand) return `${type} ${eq.brand}`;
  return type;
}

function buildEquipmentMeta(eq: EquipmentPublicDto): string {
  const parts: string[] = [];
  if (eq.brand) parts.push(eq.brand.toUpperCase());
  if (eq.serialNumber) parts.push(`S/N: ${eq.serialNumber}`);
  return parts.join(' · ');
}

interface AlertConfig {
  variant: 'info' | 'warn' | 'error' | 'neutral';
  message: string;
}

function getAlert(state: PortalState): AlertConfig | null {
  switch (state) {
    case 'offline':
      return {
        variant: 'warn',
        message: 'Este equipo ha sido marcado fuera de servicio. Contacte al área de soporte para más información.',
      };
    case 'contract_expired':
      return {
        variant: 'warn',
        message: 'Sin contrato de mantenimiento vigente. El historial de servicio puede estar desactualizado.',
      };
    case 'decommissioned':
      return {
        variant: 'neutral',
        message: 'Este equipo ha sido retirado permanentemente de operación. Para información adicional contacte al área de soporte.',
      };
    default:
      return null;
  }
}

function getContactEmail(state: PortalState): string {
  return state === 'contract_expired' ? 'ventas@stechnodes.com' : 'soporte@stechnodes.com';
}

function LoadingSkeleton() {
  return (
    <div className="loading-shell">
      <PortalHeader />
      <div className="loading-hero">
        <div className="skeleton-block" style={{ height: 22, width: '70%', borderRadius: 4 }} />
        <div className="skeleton-block" style={{ height: 14, width: '45%', borderRadius: 4 }} />
        <div className="skeleton-block" style={{ height: 22, width: 80, borderRadius: 999 }} />
      </div>
      <div className="section-block">
        <div className="skeleton-block" style={{ height: 10, width: '30%', marginBottom: 12 }} />
        {[1, 2, 3].map((i) => (
          <div key={i} className="data-row" style={{ padding: '8px 0' }}>
            <div className="skeleton-block" style={{ height: 14, width: '35%' }} />
            <div className="skeleton-block" style={{ height: 14, width: '40%' }} />
          </div>
        ))}
      </div>
      <PortalFooter />
    </div>
  );
}

function EquipmentView({ equipment }: { equipment: EquipmentPublicDto }) {
  const state = derivePortalState(equipment);
  const alert = getAlert(state);
  const contactEmail = getContactEmail(state);
  const name = buildEquipmentName(equipment);
  const meta = buildEquipmentMeta(equipment);

  const location = [equipment.branch.name, equipment.branch.city, equipment.location]
    .filter(Boolean)
    .join(' — ');

  const warrantyDisplay = (() => {
    if (!equipment.warrantyExpiresAt) return null;
    const date = formatDate(equipment.warrantyExpiresAt);
    const isExpired = new Date(equipment.warrantyExpiresAt) < new Date();
    return { text: isExpired ? `VENCIDA · ${date}` : `Vigente hasta ${date}`, expired: isExpired };
  })();

  const assetRows = [
    { field: 'N.° de serie', value: equipment.serialNumber },
    { field: 'Sede', value: location || null },
    { field: 'Instalación', value: formatDate(equipment.installDate) },
  ].filter((r) => r.value);

  const maintenanceRows = [
    warrantyDisplay
      ? {
          field: 'Garantía / contrato',
          value: warrantyDisplay.text,
          valueClass: (warrantyDisplay.expired ? 'expired' : 'active') as 'active' | 'expired',
        }
      : null,
  ].filter((r): r is NonNullable<typeof r> => r !== null);

  return (
    <div className="portal-shell">
      <PortalHeader />
      <main className="portal-content">
        <div className="desktop-grid">
          {/* Left column — always shown */}
          <div className="desktop-left">
            {/* Hero */}
            <div className="equipment-hero">
              <h1 className="equipment-name">{name}</h1>
              {meta && <div className="equipment-meta">{meta}</div>}
              <StatusBadge state={state} />
            </div>

            {/* Alert */}
            {alert && <AlertBanner variant={alert.variant} message={alert.message} />}

            {/* Asset info */}
            {assetRows.length > 0 && (
              <SectionBlock label="Información del activo" rows={assetRows} />
            )}

            {/* Maintenance info */}
            {maintenanceRows.length > 0 && state !== 'decommissioned' && (
              <SectionBlock label="Mantenimiento" rows={maintenanceRows} />
            )}

            {/* Last maintenance (D-4 / D-4.1 + distinción preventivo/correctivo) */}
            {state !== 'decommissioned' && (
              equipment.lastMaintenance ? (
                <>
                  <SectionBlock
                    label={
                      equipment.lastMaintenance.type === 'CORRECTIVE' && equipment.lastPreventiveMaintenance
                        ? 'Último mantenimiento correctivo'
                        : 'Último mantenimiento'
                    }
                    rows={[
                      { field: 'Fecha', value: formatDate(equipment.lastMaintenance.date) },
                      {
                        field: 'Tipo',
                        value: MAINTENANCE_TYPE_LABEL[equipment.lastMaintenance.type] ?? equipment.lastMaintenance.type,
                      },
                    ]}
                  />
                  {equipment.lastMaintenance.type === 'CORRECTIVE' && equipment.lastPreventiveMaintenance && (
                    <SectionBlock
                      label="Último mantenimiento preventivo"
                      rows={[
                        { field: 'Fecha', value: formatDate(equipment.lastPreventiveMaintenance.date) },
                        {
                          field: 'Tipo',
                          value:
                            MAINTENANCE_TYPE_LABEL[equipment.lastPreventiveMaintenance.type] ??
                            equipment.lastPreventiveMaintenance.type,
                        },
                      ]}
                    />
                  )}
                </>
              ) : (
                <section className="section-block">
                  <div className="section-block-label">Último mantenimiento</div>
                  <p className="section-empty-note">Sin mantenimientos registrados</p>
                </section>
              )
            )}

            {/* Contact */}
            <ContactCard
              email={contactEmail}
              phone="+57 320 584 1112"
              label={state === 'contract_expired' ? 'Renovar contrato' : 'Soporte técnico'}
            />
          </div>

          {/* Right column — desktop only */}
          <div className="desktop-right">
            <div className="desktop-right-label">Historial de mantenimientos</div>
            <div className="timeline">
              {equipment.lastMaintenance ? (
                <div className="timeline-item">
                  <div className="timeline-dot-wrap">
                    <div className="timeline-dot" />
                  </div>
                  <div>
                    <div className="timeline-date">{formatDate(equipment.lastMaintenance.date)}</div>
                    <div className="timeline-title">
                      {MAINTENANCE_TYPE_LABEL[equipment.lastMaintenance.type] ?? equipment.lastMaintenance.type}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="timeline-item">
                  <div className="timeline-dot-wrap">
                    <div className="timeline-dot muted" />
                  </div>
                  <div>
                    <div className="timeline-date">—</div>
                    <div className="timeline-title" style={{ color: 'var(--text-3)', fontWeight: 400 }}>
                      Sin mantenimientos registrados
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="timeline-phase2-note">
              El historial completo de mantenimientos estará disponible en la siguiente versión del portal.
            </div>
          </div>
        </div>
      </main>
      <PortalFooter />
    </div>
  );
}

type PageState =
  | { status: 'loading' }
  | { status: 'found'; data: EquipmentPublicDto }
  | { status: 'not_found' }
  | { status: 'network_error' };

export function EquipmentPage() {
  const { qrCode } = useParams<{ qrCode: string }>();
  const [page, setPage] = useState<PageState>({ status: 'loading' });

  useEffect(() => {
    if (!qrCode) { setPage({ status: 'not_found' }); return; }
    let cancelled = false;
    setPage({ status: 'loading' });
    fetchEquipment(qrCode).then((data) => {
      if (!cancelled) setPage({ status: 'found', data });
    }).catch((err) => {
      if (cancelled) return;
      if (err instanceof NotFoundError) setPage({ status: 'not_found' });
      else if (err instanceof NetworkError) setPage({ status: 'network_error' });
      else setPage({ status: 'not_found' });
    });
    return () => { cancelled = true; };
  }, [qrCode]);

  if (page.status === 'loading')       return <LoadingSkeleton />;
  if (page.status === 'not_found')     return <NotFoundPage />;
  if (page.status === 'network_error') return <NotFoundPage isNetworkError />;
  return <EquipmentView equipment={page.data} />;
}
