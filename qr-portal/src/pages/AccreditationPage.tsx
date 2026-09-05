import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { fetchAccreditation } from '../api/accreditation-client';
import { NotFoundError, NetworkError } from '../api/client';
import type { AccreditationPublicDto } from '../api/types';
import { PortalHeader } from '../components/PortalHeader';
import { PortalFooter } from '../components/PortalFooter';
import { NotFoundPage } from './NotFoundPage';

function LoadingSkeleton() {
  return (
    <div className="loading-shell">
      <PortalHeader />
      <div className="loading-hero">
        <div className="skeleton-block" style={{ height: 22, width: '70%', borderRadius: 4 }} />
        <div className="skeleton-block" style={{ height: 14, width: '45%', borderRadius: 4 }} />
        <div className="skeleton-block" style={{ height: 22, width: 80, borderRadius: 999 }} />
      </div>
      <PortalFooter />
    </div>
  );
}

// Etiqueta pública deliberadamente genérica — "Persona acreditada/autorizada
// por STECH NODES", nunca el tipo de vínculo interno (empleado/contratista/
// independiente). Ver Fase 3.1, Decisión 4.
function AccreditationView({ accreditation }: { accreditation: AccreditationPublicDto }) {
  const valid = accreditation.status === 'VALID';

  return (
    <div className="portal-shell">
      <PortalHeader />
      <main className="portal-content">
        <div className="equipment-hero">
          <h1 className="equipment-name">{accreditation.personName}</h1>
          <div className="equipment-meta">{accreditation.displayRole}</div>
          <span
            className={`status-badge ${valid ? 'active' : 'expired'}`}
            role="status"
            aria-label={valid ? 'Acreditación vigente' : 'Acreditación no vigente'}
          >
            <span className="status-badge-dot" aria-hidden="true" />
            {valid ? 'ACREDITACIÓN VIGENTE' : 'ACREDITACIÓN NO VIGENTE'}
          </span>
        </div>

        <section className="section-block">
          <p className="section-empty-note">
            {valid
              ? 'Esta persona se encuentra actualmente autorizada por STECH NODES para prestar servicios.'
              : 'Esta acreditación ya no se encuentra vigente. Esta persona no está actualmente autorizada por STECH NODES.'}
          </p>
        </section>
      </main>
      <PortalFooter />
    </div>
  );
}

type PageState =
  | { status: 'loading' }
  | { status: 'found'; data: AccreditationPublicDto }
  | { status: 'not_found' }
  | { status: 'network_error' };

export function AccreditationPage() {
  const { qrCode } = useParams<{ qrCode: string }>();
  const [page, setPage] = useState<PageState>({ status: 'loading' });

  useEffect(() => {
    if (!qrCode) { setPage({ status: 'not_found' }); return; }
    let cancelled = false;
    setPage({ status: 'loading' });
    fetchAccreditation(qrCode).then((data) => {
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
  return <AccreditationView accreditation={page.data} />;
}
