import { formatMoney } from '@/lib/money';
import type { RetentionConcept, RetentionJurisdiction, RetentionRate } from '@/lib/types';

// Mapeo ciudad de sede → jurisdicción de RETE ICA. Es lógica de presentación
// (decide qué fila mostrar), no una tarifa ni una regla tributaria — el
// backend mantiene el mismo mapeo (CITY_TO_JURISDICTION) como fuente de
// verdad al guardar. Ninguna tarifa ni porcentaje vive aquí: todo viene de
// `rates`, ya resuelto por el backend (GET /retention-rates).
const CITY_TO_JURISDICTION: Record<string, RetentionJurisdiction> = {
  'Bogotá': 'BOGOTA',
  'Facatativá': 'FACATATIVA',
};

const CONCEPT_LABELS: Record<RetentionConcept, string> = {
  RETE_FUENTE: 'RETE FUENTE',
  RETE_ICA: 'RETE ICA',
};

const JURISDICTION_LABELS: Record<RetentionJurisdiction, string> = {
  NACIONAL: 'Nacional',
  BOGOTA: 'Bogotá',
  FACATATIVA: 'Facatativá',
};

type LineStatus = 'aplica' | 'bajo-minimo' | 'sin-tarifa' | 'no-determinable';

interface RetentionLinePreview {
  concept: RetentionConcept;
  jurisdiction: RetentionJurisdiction | null;
  status: LineStatus;
  rate?: RetentionRate;
  estimatedAmount: number;
}

function resolveLine(
  concept: RetentionConcept,
  jurisdiction: RetentionJurisdiction | null,
  rates: RetentionRate[],
  base: number,
): RetentionLinePreview {
  if (!jurisdiction) {
    return { concept, jurisdiction, status: 'no-determinable', estimatedAmount: 0 };
  }

  const rate = rates.find((r) => r.concept === concept && r.jurisdiction === jurisdiction);
  if (!rate) {
    return { concept, jurisdiction, status: 'sin-tarifa', estimatedAmount: 0 };
  }

  if (rate.minimumBaseUvt && rate.uvtValueSnapshot) {
    const minimumBase = parseFloat(rate.minimumBaseUvt) * parseFloat(rate.uvtValueSnapshot);
    if (base < minimumBase) {
      return { concept, jurisdiction, status: 'bajo-minimo', rate, estimatedAmount: 0 };
    }
  }

  const estimatedAmount = base * (parseFloat(rate.rate) / 100);
  return { concept, jurisdiction, status: 'aplica', rate, estimatedAmount };
}

const STATUS_TEXT: Record<LineStatus, string> = {
  'aplica': '',
  'bajo-minimo': 'Bajo base mínima — no se practicaría retención',
  'sin-tarifa': 'Sin tarifa configurada para esta jurisdicción',
  'no-determinable': 'Jurisdicción no determinable (selecciona una sede con ciudad soportada)',
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
  const icaJurisdiction = branchCity ? (CITY_TO_JURISDICTION[branchCity] ?? null) : null;

  const lines: RetentionLinePreview[] = [
    resolveLine('RETE_FUENTE', 'NACIONAL', rates, base),
    resolveLine('RETE_ICA', icaJurisdiction, rates, base),
  ];

  const totalRetenido = lines.reduce((acc, l) => acc + l.estimatedAmount, 0);
  const netoEstimado = total - totalRetenido;
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
              <td className="py-2 text-xs text-[hsl(var(--muted-foreground))]">
                {line.jurisdiction ? JURISDICTION_LABELS[line.jurisdiction] : '—'}
              </td>
              <td className="py-2 text-xs">
                {line.status === 'aplica' && line.rate ? (
                  <span>{parseFloat(line.rate.rate)}%</span>
                ) : (
                  <span className="text-[hsl(var(--muted-foreground))]">{STATUS_TEXT[line.status]}</span>
                )}
              </td>
              <td className="py-2 text-right text-xs tabular-nums">
                {line.status === 'aplica' ? formatMoney(line.estimatedAmount) : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-end">
        <div className="text-sm space-y-1 min-w-[240px]">
          <div className="flex justify-between text-[hsl(var(--muted-foreground))]">
            <span>Total retenciones estimadas</span>
            <span className="tabular-nums">− {formatMoney(totalRetenido)}</span>
          </div>
          <div className="flex justify-between font-bold text-base border-t pt-1">
            <span>Neto estimado a recibir</span>
            <span className="tabular-nums">{formatMoney(netoEstimado)}</span>
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
