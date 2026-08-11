import { PortalHeader } from '../components/PortalHeader';
import { PortalFooter } from '../components/PortalFooter';

interface Props {
  isNetworkError?: boolean;
}

export function NotFoundPage({ isNetworkError }: Props) {
  return (
    <div className="portal-shell">
      <PortalHeader />
      <main className="portal-content">
        <div className="error-body">
          <div className="error-icon-wrap" aria-hidden="true">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 8v5M12 15.5v.5M4 12a8 8 0 1016 0A8 8 0 004 12z"
                stroke="#7F1D1D"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <h1 className="error-title" role="alert">
            {isNetworkError ? 'Sin conexión' : 'Código QR no reconocido'}
          </h1>
          <p className="error-desc">
            {isNetworkError
              ? 'No se pudo conectar con el servidor. Verifique su conexión a internet e intente nuevamente.'
              : 'Este código no corresponde a ningún activo registrado en el sistema. Si el equipo debería estar registrado, contacte al área de soporte.'}
          </p>
          <div className="error-contact-box">
            <div className="error-contact-label">Soporte técnico</div>
            <div className="contact-row">
              <div className="contact-icon" aria-hidden="true" />
              <a href="mailto:contacto@stechnodes.com" className="contact-link">
                contacto@stechnodes.com
              </a>
            </div>
            <div className="contact-row">
              <div className="contact-icon" aria-hidden="true" />
              <a href="tel:+573205841112" className="contact-link">
                +57 320 584 1112
              </a>
            </div>
          </div>
        </div>
      </main>
      <PortalFooter />
    </div>
  );
}
