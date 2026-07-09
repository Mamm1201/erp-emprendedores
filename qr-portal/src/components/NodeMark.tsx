export function NodeMark({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="-11 -11 22 22"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="0" cy="0" r="7.5" fill="none" stroke="white" strokeWidth="1.2" />
      <circle cx="0" cy="0" r="4.2" fill="none" stroke="white" strokeWidth="0.8" />
      <circle cx="0" cy="0" r="1.6" fill="white" />
      <line x1="0" y1="-11" x2="0" y2="-5.8" stroke="white" strokeWidth="1" />
      <line x1="0" y1="5.8" x2="0" y2="11" stroke="white" strokeWidth="1" />
      <line x1="-11" y1="0" x2="-5.8" y2="0" stroke="white" strokeWidth="1" />
      <line x1="5.8" y1="0" x2="11" y2="0" stroke="white" strokeWidth="1" />
    </svg>
  );
}
