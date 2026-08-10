import { formatMoney } from '@/lib/money';
import type { RetentionConcept, RetentionRate } from '@/lib/types';

const CONCEPT_LABELS: Record<RetentionConcept, string> = {
  RETE_FUENTE: 'RETE FUENTE',
  RETE_ICA: 'RETE ICA',
};

const RATE_FORMATTER = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 3 });

// Unidad de la tarifa: estructural por concepto, no un dato de negocio. La
// ley colombiana expresa RETE FUENTE siempre por ciento (Estatuto Tributario)
// y RETE ICA siempre por mil (acuerdos municipales) — esto no cambia con la
// ciudad ni con la tarifa cargada. El campo `rate`/`rateMin`/`rateMax` se
// almacena siempre como equivalente porcentual (mismo criterio que usa el
// cálculo: base * rate/100, tanto aquí como en QuotationsService), así que
// para RETE ICA hay que multiplicar por 10 antes de mostrarlo como ‰
// (0,966% === 9,66‰). Si algún día se carga una tarifa municipal, debe
// insertarse ya convertida a su equivalente porcentual, no el número "por
// mil" tal cual aparece en el acuerdo.
function formatRateValue(concept: RetentionConcept, rawValue: string): string {
  const percentEquivalent = parseFloat(rawValue);
  if (concept === 'RETE_ICA') {
    return `${RATE_FORMATTER.format(percentEquivalent * 10)}‰`;
  }
  return `${RATE_FORMATTER.format(percentEquivalent)}%`;
}

function formatRateText(line: RetentionLinePreview): string {
  if (!line.rate) return '';
  if (line.rate.rate !== null) {
    return formatRateValue(line.concept, line.rate.rate);
  }
  if (line.rate.rateMin !== null && line.rate.rateMax !== null) {
    return `${formatRateValue(line.concept, line.rate.rateMin)} – ${formatRateValue(line.concept, line.rate.rateMax)}`;
  }
  return '';
}

type LineStatus = 'aplica' | 'bajo-minimo' | 'sin-tarifa' | 'no-determinable';

interface RetentionLinePreview {
  concept: RetentionConcept;
  cityLabel: string; // valor a mostrar en la columna Jurisdicción — siempre presente
  status: LineStatus;
  rate?: RetentionRate;
  estimatedAmount?: number; // tarifa puntual
  estimatedAmountMin?: number; // tarifa por rango
  estimatedAmountMax?: number; // tarifa por rango
}

// cityLabelDisplay: lo que se pinta en la columna Jurisdicción, siempre
// (independiente de si hay tarifa configurada). cityLabelToMatch: lo que se
// compara contra RetentionRate.cityLabel para resolver la tarifa — null para
// RETE_FUENTE (nacional) y para RETE_ICA sin sede seleccionada.
function resolveLine(
  concept: RetentionConcept,
  cityLabelDisplay: string,
  cityLabelToMatch: string | null,
  rates: RetentionRate[],
  base: number,
): RetentionLinePreview {
  if (concept === 'RETE_ICA' && cityLabelToMatch === null) {
    return { concept, cityLabel: cityLabelDisplay, status: 'no-determinable' };
  }

  const rate = rates.find((r) => r.concept === concept && r.cityLabel === cityLabelToMatch);
  if (!rate) {
    return { concept, cityLabel: cityLabelDisplay, status: 'sin-tarifa' };
  }

  if (rate.minimumBaseUvt && rate.uvtValueSnapshot) {
    const minimumBase = parseFloat(rate.minimumBaseUvt) * parseFloat(rate.uvtValueSnapshot);
    if (base < minimumBase) {
      return { concept, cityLabel: cityLabelDisplay, status: 'bajo-minimo', rate };
    }
  }

  if (rate.rate !== null) {
    return {
      concept,
      cityLabel: cityLabelDisplay,
      status: 'aplica',
      rate,
      estimatedAmount: base * (parseFloat(rate.rate) / 100),
    };
  }

  if (rate.rateMin !== null && rate.rateMax !== null) {
    return {
      concept,
      cityLabel: cityLabelDisplay,
      status: 'aplica',
      rate,
      estimatedAmountMin: base * (parseFloat(rate.rateMin) / 100),
      estimatedAmountMax: base * (parseFloat(rate.rateMax) / 100),
    };
  }

  // Fila sin tarifa puntual ni rango válidos — inconsistente con el CHECK de
  // BD (rate xor rateMin+rateMax), no debería ocurrir. Se trata como sin
  // tarifa utilizable — nunca se asume $0.
  return { concept, cityLabel: cityLabelDisplay, status: 'sin-tarifa' };
}

const STATUS_TEXT: Record<LineStatus, string> = {
  'aplica': '',
  'bajo-minimo': 'Bajo base mínima — no se practicaría retención',
  'sin-tarifa': 'Sin tarifa configurada para esta jurisdicción',
  'no-determinable': 'Jurisdicción no determinable (selecciona una sede)',
};

export function RetentionsEstimateSection({
  rates,
  ratesLoading,
  branchCity,
  subtotal,
  discountTotal,
  total,
}: {
  rates: RetentionRate[];
  ratesLoading: boolean;
  branchCity: string | null;
  subtotal: number;
  discountTotal: number;
  total: number;
}) {
  const base = subtotal - discountTotal;

  const lines: RetentionLinePreview[] = [
    resolveLine('RETE_FUENTE', 'Nacional', null, rates, base),
    resolveLine('RETE_ICA', branchCity ?? '—', branchCity, rates, base),
  ];

  const totalMin = lines.reduce(
    (acc, l) => acc + (l.estimatedAmount ?? l.estimatedAmountMin ?? 0),
    0,
  );
  const totalMax = lines.reduce(
    (acc, l) => acc + (l.estimatedAmount ?? l.estimatedAmountMax ?? 0),
    0,
  );
  const hasRangeLine = lines.some((l) => l.estimatedAmountMin !== undefined);
  const netoMin = total - totalMax;
  const netoMax = total - totalMin;
  const hasPending = lines.some((l) => l.status === 'sin-tarifa' || l.status === 'no-determinable');

  if (ratesLoading) {
    return (
      <div className="text-xs text-[hsl(var(--muted-foreground))]">
        Cargando tarifas de retención…
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="pb-2 text-left text-xs font-medium text-[hsl(var(--muted-foreground))]">Concepto</th>
            <th className="pb-2 text-left text-xs font-medium text-[hsl(var(--muted-foreground))]">Jurisdicción</th>
            <th className="pb-2 text-left text-xs font-medium text-[hsl(var(--muted-foreground))]">Tarifa / estado</th>
            <th className="pb-2 text-right text-xs font-medium text-[hsl(var(--muted-foreground))]">Estimado</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((line) => (
            <tr key={line.concept} className="border-b last:border-0">
              <td className="py-2 text-xs font-medium">{CONCEPT_LABELS[line.concept]}</td>
              <td className="py-2 text-xs text-[hsl(var(--muted-foreground))]">{line.cityLabel}</td>
              <td className="py-2 text-xs">
                {line.status === 'aplica' && line.rate ? (
                  <span>{formatRateText(line)}</span>
                ) : (
                  <span className="text-[hsl(var(--muted-foreground))]">{STATUS_TEXT[line.status]}</span>
                )}
              </td>
              <td className="py-2 text-right text-xs tabular-nums">
                {line.status === 'aplica'
                  ? (line.estimatedAmount !== undefined
                      ? formatMoney(line.estimatedAmount)
                      : `${formatMoney(line.estimatedAmountMin ?? 0)} – ${formatMoney(line.estimatedAmountMax ?? 0)}`)
                  : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-end">
        <div className="text-sm space-y-1 min-w-[240px]">
          <div className="flex justify-between text-[hsl(var(--muted-foreground))]">
            <span>Total retenciones estimadas</span>
            <span className="tabular-nums">
              − {hasRangeLine ? `${formatMoney(totalMin)} – ${formatMoney(totalMax)}` : formatMoney(totalMin)}
            </span>
          </div>
          <div className="flex justify-between font-bold text-base border-t pt-1">
            <span>Neto estimado a recibir</span>
            <span className="tabular-nums">
              {hasRangeLine ? `${formatMoney(netoMin)} – ${formatMoney(netoMax)}` : formatMoney(netoMin)}
            </span>
          </div>
        </div>
      </div>

      <p className="text-xs text-[hsl(var(--muted-foreground))]">
        Estimado — no modifica el total de la cotización. La retención efectivamente practicada se define al momento del pago.
        {hasPending && ' Algunos conceptos no tienen tarifa configurada o jurisdicción determinable; no están incluidos en el estimado.'}
      </p>
    </div>
  );
}
