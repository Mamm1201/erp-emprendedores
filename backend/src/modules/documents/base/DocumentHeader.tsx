import React from 'react';
import { View, Text, StyleSheet, Svg, Circle, Line } from '@react-pdf/renderer';
import { palette, sp, fs, COMPANY } from './styles';

export interface DocumentHeaderProps {
  documentType: string;
  documentNumber: string;
  issueDate: string;
  expiryLabel?: string;
  expiryDate?: string;
  /** Correo de contacto del área responsable del documento */
  contactEmail?: string;
}

const s = StyleSheet.create({
  wrapper: {
    marginBottom: sp.lg,
  },
  header: {
    backgroundColor: palette.brandDark,
    paddingHorizontal: sp.lg,
    paddingTop: sp.lg,
    paddingBottom: sp.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  // Línea de acento tricolor debajo del header
  accentStrip: {
    flexDirection: 'row',
    height: 3,
  },
  accentSegment1: { flex: 2, backgroundColor: palette.brandMid },
  accentSegment2: { flex: 2, backgroundColor: palette.brand },
  accentSegment3: { flex: 1, backgroundColor: palette.accentGreen },

  companyBlock: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: sp.sm,
  },
  isotipoWrapper: {
    marginTop: 1,
    marginRight: sp.xs,
  },
  companyText: {
    flex: 1,
  },
  companyName: {
    fontSize: fs.xl,
    fontFamily: 'Helvetica-Bold',
    color: palette.white,
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  companyTagline: {
    fontSize: fs.xs,
    color: palette.brand,
    marginBottom: sp.xs,
    letterSpacing: 0.3,
  },
  companyDetail: {
    fontSize: fs.xs,
    color: '#94A3B8',
    lineHeight: 1.4,
  },
  docBlock: {
    alignItems: 'flex-end',
  },
  docType: {
    fontSize: fs.lg,
    fontFamily: 'Helvetica-Bold',
    color: palette.brand,
    letterSpacing: 0.8,
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

// Isotipo STECH NODES — Concepto C Evolucionado en react-pdf SVG
function IsotipoSvg() {
  return (
    <Svg viewBox="-130 -130 260 260" style={{ width: 34, height: 34 }}>
      <Circle cx="0" cy="0" r="100" stroke={palette.brand} strokeWidth="7" fill="none" />
      <Circle cx="0" cy="0" r="72"  stroke={palette.brand} strokeWidth="4.5" fill="none" />
      <Circle cx="0" cy="0" r="16"  fill={palette.brand} />
      <Line x1="0"   y1="44"  x2="0"    y2="-117" stroke={palette.brand} strokeWidth="8"   strokeLinecap="round" />
      <Line x1="0"   y1="-44" x2="0"    y2="117"  stroke={palette.brand} strokeWidth="8"   strokeLinecap="round" />
      <Line x1="-44" y1="0"   x2="117"  y2="0"    stroke={palette.brand} strokeWidth="8"   strokeLinecap="round" />
      <Line x1="44"  y1="0"   x2="-117" y2="0"    stroke={palette.brand} strokeWidth="8"   strokeLinecap="round" />
    </Svg>
  );
}

export function DocumentHeader({
  documentType,
  documentNumber,
  issueDate,
  expiryLabel,
  expiryDate,
  contactEmail,
}: DocumentHeaderProps) {
  const email = contactEmail ?? COMPANY.emails.contacto;
  return (
    <View style={s.wrapper}>
      <View style={s.header}>
        {/* Bloque empresa — izquierda */}
        <View style={s.companyBlock}>
          <View style={s.isotipoWrapper}>
            <IsotipoSvg />
          </View>
          <View style={s.companyText}>
            <Text style={s.companyName}>{COMPANY.name}</Text>
            <Text style={s.companyTagline}>{COMPANY.tagline}</Text>
            <Text style={s.companyDetail}>{COMPANY.city}, {COMPANY.country}</Text>
            <Text style={s.companyDetail}>{email}</Text>
            <Text style={s.companyDetail}>{COMPANY.website}</Text>
          </View>
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

      {/* Línea de acento tricolor */}
      <View style={s.accentStrip}>
        <View style={s.accentSegment1} />
        <View style={s.accentSegment2} />
        <View style={s.accentSegment3} />
      </View>
    </View>
  );
}
