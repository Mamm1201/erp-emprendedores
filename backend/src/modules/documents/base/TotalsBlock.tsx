import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { palette, sp, fs } from './styles';

export interface TotalsBlockProps {
  subtotal: string | number;
  discountTotal: string | number;
  taxTotal: string | number;
  total: string | number;
}

const s = StyleSheet.create({
  wrapper: {
    alignItems: 'flex-end',
    marginBottom: sp.lg,
  },
  inner: {
    width: '38%',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: sp.xs,
  },
  label: {
    fontSize: fs.base,
    color: palette.muted,
  },
  value: {
    fontSize: fs.base,
    color: palette.text,
    textAlign: 'right',
  },
  separator: {
    borderTopWidth: 0.5,
    borderTopColor: palette.border,
    marginVertical: sp.xs,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: sp.xs,
  },
  totalLabel: {
    fontSize: fs.md,
    fontFamily: 'Helvetica-Bold',
    color: palette.dark,
  },
  totalValue: {
    fontSize: fs.md,
    fontFamily: 'Helvetica-Bold',
    color: palette.brand,
    textAlign: 'right',
  },
});

function fmt(val: string | number): string {
  const n = typeof val === 'string' ? parseFloat(val) : val;
  if (isNaN(n)) return '$ 0';
  return `$ ${n.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export function TotalsBlock({ subtotal, discountTotal, taxTotal, total }: TotalsBlockProps) {
  const disc = typeof discountTotal === 'string' ? parseFloat(discountTotal) : discountTotal;
  const tax = typeof taxTotal === 'string' ? parseFloat(taxTotal) : taxTotal;

  return (
    <View style={s.wrapper}>
      <View style={s.inner}>
        <View style={s.row}>
          <Text style={s.label}>Subtotal</Text>
          <Text style={s.value}>{fmt(subtotal)}</Text>
        </View>
        {disc > 0 && (
          <View style={s.row}>
            <Text style={s.label}>Descuentos</Text>
            <Text style={[s.value, { color: palette.brand }]}>− {fmt(discountTotal)}</Text>
          </View>
        )}
        {tax > 0 && (
          <View style={s.row}>
            <Text style={s.label}>IVA / Impuestos</Text>
            <Text style={s.value}>{fmt(taxTotal)}</Text>
          </View>
        )}
        <View style={s.separator} />
        <View style={s.totalRow}>
          <Text style={s.totalLabel}>TOTAL</Text>
          <Text style={s.totalValue}>{fmt(total)}</Text>
        </View>
      </View>
    </View>
  );
}
