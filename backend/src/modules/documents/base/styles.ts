// ─── Motor Documental STECH NODES — Design System ────────────────────────────
// Este archivo es la única fuente de verdad de estilos para todos los documentos
// del ERP. No depende del CSS del frontend. Valores hex explícitos.

export const palette = {
  brand: '#0D9488',     // teal — color de acento STECH NODES
  dark: '#0F172A',      // slate-900 — fondo del encabezado de documento
  text: '#1F2937',      // gray-800 — cuerpo de texto principal
  muted: '#6B7280',     // gray-500 — texto secundario y etiquetas
  border: '#E5E7EB',    // gray-200 — líneas de tabla y separadores
  surface: '#F9FAFB',   // gray-50 — fondo de cabeceras de tabla
  white: '#FFFFFF',
  // Slots reservados para estados de documento en hitos futuros
  // void: '#DC2626',   // rojo — documento anulado
  // draft: '#D97706',  // ámbar — borrador
};

export const sp = {
  xs: 3,
  sm: 6,
  md: 10,
  lg: 16,
  xl: 24,
  xxl: 36,
};

export const fs = {
  xs: 7,
  sm: 8,
  base: 9,
  md: 10,
  lg: 12,
  xl: 16,
  xxl: 22,
};

// ─── Datos de la empresa ──────────────────────────────────────────────────────
// Mover a configuración dinámica (tabla `company_settings`) en un hito futuro.

export const COMPANY = {
  name: 'STECH NODES',
  tagline: 'Tecnología de Experiencia del Paciente',
  email: 'contacto@stechnodes.com',
  phone: '+57 (601) 000-0000',
  city: 'Bogotá D.C., Colombia',
  website: 'www.stechnodes.com',
};
