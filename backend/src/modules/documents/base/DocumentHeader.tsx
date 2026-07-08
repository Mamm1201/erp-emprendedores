import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { palette, sp, fs, COMPANY } from './styles';

// ─── Props ────────────────────────────────────────────────────────────────────
// La interfaz ya incluye slots reservados para crecimiento futuro.
// En Hito 9 solo se renderiza la información básica de empresa y documento.

export interface DocumentHeaderProps {
  // Tipo y número de documento (ej. "COTIZACIÓN", "COT-2026-00001")
  documentType: string;
  documentNumber: string;

  // Fechas del documento
  issueDate: string;
  expiryLabel?: string; // "Válida hasta:", "Vence:", etc.
  expiryDate?: string;

  // Slots reservados — no se renderizan en Hito 9
  // documentVersion?: string;      // "v1.0" — versión del formato
  // documentCode?: string;         // código interno de control documental
  // status?: { label: string; color: string }; // estado visible (Borrador, Anulado…)
}

const s = StyleSheet.create({
  header: {
    backgroundColor: palette.dark,
    padding: sp.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: sp.lg,
  },
  companyBlock: {
    flex: 1,
  },
  companyName: {
    fontSize: fs.xl,
    fontFamily: 'Helvetica-Bold',
    color: palette.white,
    letterSpacing: 1,
    marginBottom: sp.xs,
  },
  companyTagline: {
    fontSize: fs.sm,
    color: palette.brand,
    marginBottom: sp.xs,
  },
  companyDetail: {
    fontSize: fs.xs,
    color: '#94A3B8',
  },
  docBlock: {
    alignItems: 'flex-end',
  },
  docType: {
    fontSize: fs.lg,
    fontFamily: 'Helvetica-Bold',
    color: palette.brand,
    letterSpacing: 0.5,
    marginBottom: sp.xs,
  },
  docNumber: {
    fontSize: fs.md,
    fontFamily: 'Helvetica-Bold',
    color: palette.white,
    marginBottom: sp.sm,
  },
  docDateLabel: {
    fontSize: fs.xs,
    color: '#94A3B8',
    marginBottom: 1,
  },
  docDateValue: {
    fontSize: fs.sm,
    color: palette.white,
    marginBottom: sp.xs,
  },
});

export function DocumentHeader({
  documentType,
  documentNumber,
  issueDate,
  expiryLabel,
  expiryDate,
}: DocumentHeaderProps) {
  return (
    <View style={s.header}>
      {/* Bloque empresa — izquierda */}
      <View style={s.companyBlock}>
        <Text style={s.companyName}>{COMPANY.name}</Text>
        <Text style={s.companyTagline}>{COMPANY.tagline}</Text>
        <Text style={s.companyDetail}>{COMPANY.city}</Text>
        <Text style={s.companyDetail}>{COMPANY.email}</Text>
        <Text style={s.companyDetail}>{COMPANY.website}</Text>
      </View>

      {/* Bloque documento — derecha */}
      <View style={s.docBlock}>
        <Text style={s.docType}>{documentType}</Text>
        <Text style={s.docNumber}>{documentNumber}</Text>
        <Text style={s.docDateLabel}>Fecha de emisión</Text>
        <Text style={s.docDateValue}>{issueDate}</Text>
        {expiryLabel && expiryDate && (
          <>
            <Text style={s.docDateLabel}>{expiryLabel}</Text>
            <Text style={s.docDateValue}>{expiryDate}</Text>
          </>
        )}
      </View>
    </View>
  );
}
