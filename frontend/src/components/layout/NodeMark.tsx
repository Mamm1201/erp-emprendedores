// Isotipo STECH NODES — Concepto C Evolucionado
// Retículo de Precisión Técnica. Marcas cardinales que cruzan el anillo exterior.
// Sistema de identidad visual aprobado 2026-07-08. No modificar sin aprobación de dirección.

export function NodeMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="-130 -130 260 260"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
    >
      {/* Anillo exterior */}
      <circle cx="0" cy="0" r="100" stroke="currentColor" strokeWidth="6.5" />
      {/* Anillo interior */}
      <circle cx="0" cy="0" r="72" stroke="currentColor" strokeWidth="4" />
      {/* Punto central */}
      <circle cx="0" cy="0" r="16" fill="currentColor" />
      {/* Marcas cardinales — nacen en 0.44R, cruzan el anillo exterior, terminan en 1.17R */}
      <line x1="0" y1="44"  x2="0"    y2="-117" stroke="currentColor" strokeWidth="7.5" strokeLinecap="round" />
      <line x1="0" y1="-44" x2="0"    y2="117"  stroke="currentColor" strokeWidth="7.5" strokeLinecap="round" />
      <line x1="-44" y1="0" x2="117"  y2="0"    stroke="currentColor" strokeWidth="7.5" strokeLinecap="round" />
      <line x1="44"  y1="0" x2="-117" y2="0"    stroke="currentColor" strokeWidth="7.5" strokeLinecap="round" />
    </svg>
  );
}
