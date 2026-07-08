// ─── Motor Documental STECH NODES — Design System ────────────────────────────
// Paleta aprobada 2026-07-08. Sistema de Identidad Visual STECH NODES v1.0.
// No modificar sin aprobación de dirección creativa.

export const palette = {
  brand:        '#378ADD',   // azul símbolo — acento sobre fondo oscuro (header)
  brandMid:     '#185FA5',   // azul técnico — segundo acento
  brandDark:    '#042C53',   // azul noche   — fondo del encabezado de documento
  dark:         '#042C53',   // alias de compatibilidad → brandDark
  accentGreen:  '#0F6E56',   // verde control — tercer color de la línea de acento
  text:         '#1F2937',   // cuerpo de texto principal
  muted:        '#6B7280',   // texto secundario y etiquetas
  border:       '#E5E7EB',   // líneas de tabla y separadores
  surface:      '#F9FAFB',   // fondo de cabeceras de tabla
  white:        '#FFFFFF',
};

export const sp = {
  xs:  3,
  sm:  6,
  md:  10,
  lg:  16,
  xl:  24,
  xxl: 36,
};

export const fs = {
  xs:  7,
  sm:  8,
  base: 9,
  md:  10,
  lg:  12,
  xl:  16,
  xxl: 22,
};

// ─── Datos de la empresa ──────────────────────────────────────────────────────
// Fuente única de verdad para todos los documentos institucionales.
// Mover a configuración dinámica (tabla `company_settings`) en un hito futuro.

export const COMPANY = {
  name:    'STECH NODES',
  tagline: 'Operaciones técnicas, bajo control.',
  city:    'Bogotá D.C.',
  country: 'Colombia',
  phone:   '+57 (601) 000-0000',
  website: 'www.stechnodes.com',

  // Correos por área — usar el específico en cada tipo de documento
  emails: {
    contacto:    'contacto@stechnodes.com',    // institucional / general
    ventas:      'ventas@stechnodes.com',      // Cotizaciones · Contratos
    soporte:     'soporte@stechnodes.com',     // Órdenes de Trabajo · Actas
    facturacion: 'facturacion@stechnodes.com', // Cuentas de Cobro
  },
} as const;
