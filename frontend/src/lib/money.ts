export function formatMoney(value: string | number): string {
  const n = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(n)) return '$ 0';
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

export function calcLineTotal(
  quantity: number,
  unitPrice: number,
  discountAmount = 0,
  taxRate = 0,
) {
  const sub = quantity * unitPrice - discountAmount;
  const tax = sub * (taxRate / 100);
  return { lineSubtotal: sub, lineTotal: sub + tax };
}
