import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { palette, sp, fs } from './styles';

// ─── Grilla de información en dos columnas ────────────────────────────────────
// Usada para datos de cliente/sede en cotizaciones, cuentas de cobro, etc.

export interface InfoField {
  label: string;
  value: string | null | undefined;
}

export interface InfoGridProps {
  left: InfoField[];
  right: InfoField[];
  title?: string;
}

const s = StyleSheet.create({
  wrapper: {
    marginBottom: sp.lg,
  },
  title: {
    fontSize: fs.xs,
    fontFamily: 'Helvetica-Bold',
    color: palette.muted,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: sp.sm,
    paddingBottom: sp.xs,
    borderBottomWidth: 0.5,
    borderBottomColor: palette.border,
  },
  columns: {
    flexDirection: 'row',
    gap: sp.xl,
  },
  column: {
    flex: 1,
  },
  field: {
    marginBottom: sp.sm,
  },
  label: {
    fontSize: fs.xs,
    color: palette.muted,
    marginBottom: 1,
  },
  value: {
    fontSize: fs.base,
    color: palette.text,
    fontFamily: 'Helvetica',
  },
  emptyValue: {
    fontSize: fs.base,
    color: palette.border,
  },
});

function InfoColumn({ fields }: { fields: InfoField[] }) {
  return (
    <View style={s.column}>
      {fields.map((f, i) => (
        <View key={i} style={s.field}>
          <Text style={s.label}>{f.label.toUpperCase()}</Text>
          {f.value ? (
            <Text style={s.value}>{f.value}</Text>
          ) : (
            <Text style={s.emptyValue}>—</Text>
          )}
        </View>
      ))}
    </View>
  );
}

export function InfoGrid({ left, right, title }: InfoGridProps) {
  return (
    <View style={s.wrapper}>
      {title && <Text style={s.title}>{title}</Text>}
      <View style={s.columns}>
        <InfoColumn fields={left} />
        <InfoColumn fields={right} />
      </View>
    </View>
  );
}
