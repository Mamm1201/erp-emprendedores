import { Prisma } from '../../generated/prisma/client';

const MONEY_SCALE = 2;
const QUANTITY_SCALE = 3;

export function toMoney(value: number | string | Prisma.Decimal): Prisma.Decimal {
  return new Prisma.Decimal(value);
}

export function roundMoney(value: Prisma.Decimal): Prisma.Decimal {
  return value.toDecimalPlaces(MONEY_SCALE, Prisma.Decimal.ROUND_HALF_UP);
}

export function roundQuantity(value: Prisma.Decimal): Prisma.Decimal {
  return value.toDecimalPlaces(QUANTITY_SCALE, Prisma.Decimal.ROUND_HALF_UP);
}

export interface LineTotalsInput {
  quantity: Prisma.Decimal;
  unitPrice: Prisma.Decimal;
  discountAmount: Prisma.Decimal;
  taxRate: Prisma.Decimal;
}

export interface LineTotalsResult {
  lineSubtotal: Prisma.Decimal;
  lineTax: Prisma.Decimal;
  lineTotal: Prisma.Decimal;
}

/** subtotal = qty * price - discount; tax = subtotal * (rate/100); total = subtotal + tax */
export function calculateLineTotals(input: LineTotalsInput): LineTotalsResult {
  const gross = input.quantity.mul(input.unitPrice);
  const lineSubtotal = roundMoney(gross.sub(input.discountAmount));
  const lineTax = roundMoney(
    lineSubtotal.mul(input.taxRate).div(100),
  );
  const lineTotal = roundMoney(lineSubtotal.add(lineTax));

  return { lineSubtotal, lineTax, lineTotal };
}

export function sumMoney(values: Prisma.Decimal[]): Prisma.Decimal {
  return values.reduce(
    (acc, value) => roundMoney(acc.add(value)),
    toMoney(0),
  );
}
