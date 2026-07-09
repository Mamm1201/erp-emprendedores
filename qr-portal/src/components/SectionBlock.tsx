interface Row {
  field: string;
  value: string | null | undefined;
  valueClass?: 'muted' | 'active' | 'expired';
}

interface Props {
  label: string;
  rows: Row[];
}

export function SectionBlock({ label, rows }: Props) {
  return (
    <section className="section-block">
      <div className="section-block-label">{label}</div>
      {rows.map((row) => (
        <div className="data-row" key={row.field}>
          <span className="data-row-field">{row.field}</span>
          <span className={`data-row-value ${row.valueClass ?? ''}`}>
            {row.value ?? '—'}
          </span>
        </div>
      ))}
    </section>
  );
}
