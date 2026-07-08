import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { palette, sp, fs, COMPANY } from './styles';

// ─── Props ────────────────────────────────────────────────────────────────────
// Slots reservados para crecimiento futuro:
// - verificationCode?: string   — código de verificación / QR en hito futuro
// - legalNotice?: string        — aviso legal personalizado por tipo de documento

export interface DocumentFooterProps {
  generatedAt: string;
  // verificationCode?: string;  // reservado — Hito futuro (QR / firma digital)
}

const s = StyleSheet.create({
  footer: {
    position: 'absolute',
    bottom: sp.xl,
    left: sp.xxl,
    right: sp.xxl,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 0.5,
    borderTopColor: palette.border,
    paddingTop: sp.sm,
  },
  left: {
    flex: 1,
  },
  right: {
    alignItems: 'flex-end',
  },
  text: {
    fontSize: fs.xs,
    color: palette.muted,
  },
  brand: {
    fontSize: fs.xs,
    color: palette.brand,
  },
  pageNumber: {
    fontSize: fs.xs,
    color: palette.muted,
  },
});

export function DocumentFooter({ generatedAt }: DocumentFooterProps) {
  return (
    <View style={s.footer} fixed>
      <View style={s.left}>
        <Text style={s.brand}>{COMPANY.name}</Text>
        <Text style={s.text}>Generado: {generatedAt}</Text>
      </View>
      <View style={s.right}>
        <Text
          style={s.pageNumber}
          render={({ pageNumber, totalPages }) =>
            `Página ${pageNumber} de ${totalPages}`
          }
        />
      </View>
    </View>
  );
}
