interface Props {
  variant: 'info' | 'warn' | 'error' | 'neutral';
  message: string;
}

export function AlertBanner({ variant, message }: Props) {
  return (
    <div className={`alert-banner ${variant}`} role="alert">
      {message}
    </div>
  );
}
