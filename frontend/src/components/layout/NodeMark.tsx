export function NodeMark({ className }: { className?: string }) {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
    >
      <line x1="14" y1="14" x2="5"  y2="7"  stroke="currentColor" strokeWidth="1"   strokeOpacity="0.35" />
      <line x1="14" y1="14" x2="23" y2="7"  stroke="currentColor" strokeWidth="1"   strokeOpacity="0.35" />
      <line x1="14" y1="14" x2="5"  y2="21" stroke="currentColor" strokeWidth="1"   strokeOpacity="0.35" />
      <line x1="14" y1="14" x2="23" y2="21" stroke="currentColor" strokeWidth="1"   strokeOpacity="0.35" />

      <circle cx="5"  cy="7"  r="2.5" fill="currentColor" fillOpacity="0.4" />
      <circle cx="23" cy="7"  r="2.5" fill="currentColor" fillOpacity="0.4" />
      <circle cx="5"  cy="21" r="2.5" fill="currentColor" fillOpacity="0.25" />
      <circle cx="23" cy="21" r="2.5" fill="currentColor" fillOpacity="0.25" />

      <circle cx="14" cy="14" r="5"   fill="currentColor" fillOpacity="0.15" />
      <circle cx="14" cy="14" r="3"   fill="currentColor" />
    </svg>
  );
}
