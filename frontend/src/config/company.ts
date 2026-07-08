// ─── Datos institucionales STECH NODES ───────────────────────────────────────
// Fuente única de verdad para el frontend.
// El backend mantiene su propia copia en backend/src/modules/documents/base/styles.ts.
// Actualizar ambas si se modifica algún valor.

export const COMPANY = {
  name:    'STECH NODES',
  tagline: 'Operaciones técnicas, bajo control.',
  city:    'Bogotá D.C.',
  country: 'Colombia',
  phone:   '+57 (601) 000-0000',
  website: 'www.stechnodes.com',

  emails: {
    contacto:    'contacto@stechnodes.com',
    ventas:      'ventas@stechnodes.com',
    soporte:     'soporte@stechnodes.com',
    facturacion: 'facturacion@stechnodes.com',
  },
} as const;
