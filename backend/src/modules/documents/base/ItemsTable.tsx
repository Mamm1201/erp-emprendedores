import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { palette, sp, fs } from './styles';

export interface LineItem {
  lineOrder: number;
  description: string;
  quantity: string | number;
  unitPrice: string | number;
  discountAmount: string | number;
  taxRate: string | number;
  lineSubtotal: string | number;
  lineTotal: string | number;
}

const COL = {
  desc: '42%',
  qty: '8%',
  price: '14%',
  discount: '12%',
  tax: '8%',
  total: '16%',
};

const s = StyleSheet.create({
  table: {
    marginBottom: sp.md,
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: palette.dark,
    paddingHorizontal: sp.sm,
    paddingVertical: sp.xs,
  },
  headerCell: {
    fontSize: fs.xs,
    fontFamily: 'Helvetica-Bold',
    color: palette.white,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    paddingHorizontal: sp.sm,
    paddingVertical: sp.sm,
    borderBottomWidth: 0.5,
    borderBottomColor: palette.border,
  },
  rowAlt: {
    backgroundColor: palette.surface,
  },
  cell: {
    fontSize: fs.base,
    color: palette.text,
  },
  cellRight: {
    textAlign: 'right',
  },
  cellMuted: {
    color: palette.muted,
  },
});

function fmt(val: string | number): string {
  const n = typeof val === 'string' ? parseFloat(val) : val;
  if (isNaN(n)) return '$ 0';
  return `$ ${n.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function fmtQty(val: string | number): string {
  const n = typeof val === 'string' ? parseFloat(val) : val;
  return isNaN(n) ? '0' : n.toLocaleString('es-CO', { maximumFractionDigits: 2 });
}

function fmtPct(val: string | number): string {
  const n = typeof val === 'string' ? parseFloat(val) : val;
  if (isNaN(n) || n === 0) return '—';
  return `${n}%`;
}

export function ItemsTable({ items }: { items: LineItem[] }) {
  return (
    <View style={s.table}>
      {/* Cabecera */}
      <View style={s.headerRow}>
        <Text style={[s.headerCell, { width: COL.desc }]}>Descripción</Text>
        <Text style={[s.headerCell, { width: COL.qty, textAlign: 'right' }]}>Cant.</Text>
        <Text style={[s.headerCell, { width: COL.price, textAlign: 'right' }]}>Precio unit.</Text>
        <Text style={[s.headerCell, { width: COL.discount, textAlign: 'right' }]}>Descuento</Text>
        <Text style={[s.headerCell, { width: COL.tax, textAlign: 'right' }]}>IVA</Text>
        <Text style={[s.headerCell, { width: COL.total, textAlign: 'right' }]}>Total línea</Text>
      </View>

      {/* Filas */}
      {items.map((item, i) => (
        <View key={i} style={[s.row, i % 2 === 1 ? s.rowAlt : {}]}>
          <Text style={[s.cell, { width: COL.desc }]}>{item.description}</Text>
          <Text style={[s.cell, s.cellRight, { width: COL.qty }]}>{fmtQty(item.quantity)}</Text>
          <Text style={[s.cell, s.cellRight, { width: COL.price }]}>{fmt(item.unitPrice)}</Text>
          <Text style={[s.cell, s.cellRight, s.cellMuted, { width: COL.discount }]}>
            {parseFloat(String(item.discountAmount)) > 0 ? `− ${fmt(item.discountAmount)}` : '—'}
          </Text>
          <Text style={[s.cell, s.cellRight, s.cellMuted, { width: COL.tax }]}>
            {fmtPct(item.taxRate)}
          </Text>
          <Text style={[s.cell, s.cellRight, { width: COL.total, fontFamily: 'Helvetica-Bold' }]}>
            {fmt(item.lineTotal)}
          </Text>
        </View>
      ))}
    </View>
  );
}
