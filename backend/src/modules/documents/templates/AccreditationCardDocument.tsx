import React from 'react';
import { View, Text, Image, StyleSheet, Svg, Circle, Line } from '@react-pdf/renderer';
import { PageLayout } from '../base/PageLayout';
import { DocumentFooter } from '../base/DocumentFooter';
import { palette, sp, fs, COMPANY } from '../base/styles';
import type { AccreditationCardPdfDto } from '../dto/accreditation-card-pdf.dto';

const s = StyleSheet.create({
  header: {
    backgroundColor: palette.brandDark,
    paddingHorizontal: sp.lg,
    paddingVertical: sp.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp.sm,
    marginBottom: sp.xxl,
  },
  isotipoWrapper: {
    marginRight: sp.xs,
  },
  companyName: {
    fontSize: fs.xl,
    fontFamily: 'Helvetica-Bold',
    color: palette.white,
    letterSpacing: 1.2,
  },
  headerTag: {
    fontSize: fs.sm,
    color: palette.brand,
    letterSpacing: 2,
    marginTop: 2,
  },
  accentStrip: {
    flexDirection: 'row',
    height: 3,
    marginBottom: sp.xxl,
  },
  accentSegment1: { flex: 2, backgroundColor: palette.brandMid },
  accentSegment2: { flex: 2, backgroundColor: palette.brand },
  accentSegment3: { flex: 1, backgroundColor: palette.accentGreen },

  card: {
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 8,
    paddingVertical: sp.xxl,
    paddingHorizontal: sp.xl,
    alignItems: 'center',
    marginHorizontal: sp.xxl,
  },
  eyebrow: {
    fontSize: fs.sm,
    color: palette.muted,
    letterSpacing: 2,
    marginBottom: sp.lg,
  },
  personName: {
    fontSize: fs.xxl,
    fontFamily: 'Helvetica-Bold',
    color: palette.text,
    marginBottom: sp.xs,
    textAlign: 'center',
  },
  displayRole: {
    fontSize: fs.lg,
    color: palette.muted,
    marginBottom: sp.lg,
  },
  statusBadge: {
    paddingVertical: sp.xs,
    paddingHorizontal: sp.md,
    borderRadius: 999,
    marginBottom: sp.xl,
  },
  statusValid: {
    backgroundColor: '#D1FAE5',
  },
  statusInvalid: {
    backgroundColor: '#FEE2E2',
  },
  statusTextValid: {
    fontSize: fs.base,
    fontFamily: 'Helvetica-Bold',
    color: palette.accentGreen,
    letterSpacing: 1,
  },
  statusTextInvalid: {
    fontSize: fs.base,
    fontFamily: 'Helvetica-Bold',
    color: '#991B1B',
    letterSpacing: 1,
  },
  qrImage: {
    width: 140,
    height: 140,
    marginBottom: sp.lg,
  },
  validity: {
    fontSize: fs.sm,
    color: palette.muted,
    marginBottom: sp.md,
  },
  disclaimer: {
    fontSize: fs.sm,
    color: palette.text,
    textAlign: 'center',
    maxWidth: 320,
  },
});

// Isotipo STECH NODES — copia local del mismo diseño usado en DocumentHeader
// (no exportado desde ese archivo; se duplica aquí para no tocar un módulo
// fuera del alcance de este incremento).
function IsotipoSvg() {
  return (
    <Svg viewBox="-130 -130 260 260" style={{ width: 30, height: 30 }}>
      <Circle cx="0" cy="0" r="100" stroke={palette.brand} strokeWidth="7" fill="none" />
      <Circle cx="0" cy="0" r="72" stroke={palette.brand} strokeWidth="4.5" fill="none" />
      <Circle cx="0" cy="0" r="16" fill={palette.brand} />
      <Line x1="0" y1="44" x2="0" y2="-117" stroke={palette.brand} strokeWidth="8" strokeLinecap="round" />
      <Line x1="0" y1="-44" x2="0" y2="117" stroke={palette.brand} strokeWidth="8" strokeLinecap="round" />
      <Line x1="-44" y1="0" x2="117" y2="0" stroke={palette.brand} strokeWidth="8" strokeLinecap="round" />
      <Line x1="44" y1="0" x2="-117" y2="0" stroke={palette.brand} strokeWidth="8" strokeLinecap="round" />
    </Svg>
  );
}

interface AccreditationCardDocumentProps {
  data: AccreditationCardPdfDto;
}

export function AccreditationCardDocument({ data }: AccreditationCardDocumentProps) {
  const hasValidity = data.validFrom || data.validUntil;

  return (
    <PageLayout>
      <View style={s.header}>
        <View style={s.isotipoWrapper}>
          <IsotipoSvg />
        </View>
        <View>
          <Text style={s.companyName}>{COMPANY.name}</Text>
          <Text style={s.headerTag}>PERSONAL AUTORIZADO</Text>
        </View>
      </View>
      <View style={s.accentStrip}>
        <View style={s.accentSegment1} />
        <View style={s.accentSegment2} />
        <View style={s.accentSegment3} />
      </View>

      <View style={s.card}>
        <Text style={s.eyebrow}>PERSONA ACREDITADA/AUTORIZADA POR STECH NODES</Text>
        <Text style={s.personName}>{data.personName}</Text>
        <Text style={s.displayRole}>{data.displayRole}</Text>

        <View style={[s.statusBadge, data.vigente ? s.statusValid : s.statusInvalid]}>
          <Text style={data.vigente ? s.statusTextValid : s.statusTextInvalid}>
            {data.vigente ? 'ACREDITACIÓN VIGENTE' : 'ACREDITACIÓN NO VIGENTE'}
          </Text>
        </View>

        <Image src={data.qrDataUrl} style={s.qrImage} />

        {hasValidity && (
          <Text style={s.validity}>
            Vigencia: {data.validFrom ?? 'sin inicio'} — {data.validUntil ?? 'sin vencimiento'}
          </Text>
        )}

        <Text style={s.disclaimer}>
          {data.vigente
            ? 'Esta persona se encuentra actualmente autorizada por STECH NODES para prestar servicios. Escanee el código QR para verificar el estado vigente de esta acreditación.'
            : 'Esta acreditación ya no se encuentra vigente. Esta persona no está actualmente autorizada por STECH NODES. Escanee el código QR para verificar el estado actual.'}
        </Text>
      </View>

      <DocumentFooter generatedAt={data.generatedAt} />
    </PageLayout>
  );
}
