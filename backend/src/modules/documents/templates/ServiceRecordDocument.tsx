import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { PageLayout } from '../base/PageLayout';
import { DocumentHeader } from '../base/DocumentHeader';
import { DocumentFooter } from '../base/DocumentFooter';
import { InfoGrid } from '../base/InfoGrid';
import { SectionTitle } from '../base/SectionTitle';
import { palette, sp, fs, COMPANY } from '../base/styles';
import type { ServiceRecordPdfDto, ChecklistItemPdfDto } from '../dto/service-record-pdf.dto';

const RESULT_LABEL: Record<string, string> = {
  OK: 'OK',
  WARNING: 'Alerta',
  FAIL: 'Fallo',
  NA: 'N/A',
};

const RESULT_COLOR: Record<string, string> = {
  OK: '#0D9488',
  WARNING: '#D97706',
  FAIL: '#DC2626',
  NA: '#9CA3AF',
};

const s = StyleSheet.create({
  narrativeBlock: {
    marginBottom: sp.md,
  },
  narrativeLabel: {
    fontSize: fs.xs,
    fontFamily: 'Helvetica-Bold',
    color: palette.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: sp.xs,
  },
  narrativeText: {
    fontSize: fs.base,
    color: palette.text,
    lineHeight: 1.5,
  },
  narrativeEmpty: {
    fontSize: fs.base,
    color: palette.border,
    fontStyle: 'italic',
  },
  checklistRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: sp.xs,
    borderBottomWidth: 0.5,
    borderBottomColor: palette.border,
    gap: sp.sm,
  },
  checklistDesc: {
    flex: 1,
    fontSize: fs.base,
    color: palette.text,
  },
  checklistBadge: {
    fontSize: fs.xs,
    fontFamily: 'Helvetica-Bold',
    paddingHorizontal: sp.xs,
    paddingVertical: 2,
    borderRadius: 2,
    minWidth: 36,
    textAlign: 'center',
  },
  checklistNotes: {
    fontSize: fs.xs,
    color: palette.muted,
    marginTop: 2,
    fontStyle: 'italic',
  },
  signatureBlock: {
    marginTop: sp.xl,
    flexDirection: 'row',
    gap: sp.xl,
  },
  signatureBox: {
    flex: 1,
    borderTopWidth: 1,
    borderTopColor: palette.dark,
    paddingTop: sp.xs,
  },
  signatureLabel: {
    fontSize: fs.xs,
    color: palette.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  signatureValue: {
    fontSize: fs.sm,
    color: palette.text,
    marginTop: sp.xs,
  },
});

function NarrativeField({ label, value }: { label: string; value: string | null }) {
  return (
    <View style={s.narrativeBlock}>
      <Text style={s.narrativeLabel}>{label}</Text>
      {value ? (
        <Text style={s.narrativeText}>{value}</Text>
      ) : (
        <Text style={s.narrativeEmpty}>Sin información registrada</Text>
      )}
    </View>
  );
}

function ChecklistSection({ items }: { items: ChecklistItemPdfDto[] }) {
  if (items.length === 0) return null;
  return (
    <>
      <SectionTitle>Checklist de inspección</SectionTitle>
      <View>
        {items.map((item, i) => (
          <View key={i} style={s.checklistRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.checklistDesc}>{item.description}</Text>
              {item.notes ? <Text style={s.checklistNotes}>{item.notes}</Text> : null}
            </View>
            <Text style={[s.checklistBadge, { color: RESULT_COLOR[item.result] ?? palette.muted }]}>
              {RESULT_LABEL[item.result] ?? item.result}
            </Text>
          </View>
        ))}
      </View>
    </>
  );
}

export function ServiceRecordDocument({ data }: { data: ServiceRecordPdfDto }) {
  const clientLeft = [
    { label: 'Cliente', value: data.clientLegalName },
    { label: 'NIT / RUT', value: data.clientTaxId },
    { label: 'Sede', value: data.branchName },
    { label: 'Ciudad', value: data.branchCity },
  ].filter((f) => f.value);

  const visitRight = [
    { label: 'Técnico asignado', value: data.technicianName },
    { label: 'Fecha programada', value: data.scheduledAt },
    { label: 'Fecha de cierre', value: data.completedAt },
    { label: 'Firmado por cliente', value: data.clientSignedAt },
  ].filter((f) => f.value);

  return (
    <PageLayout>
      <DocumentHeader
        documentType="ACTA TÉCNICA"
        documentNumber={data.workOrderNumber}
        issueDate={data.generatedAt}
        contactEmail={COMPANY.emails.soporte}
      />

      <InfoGrid
        title="Datos de la visita"
        left={clientLeft.length > 0 ? clientLeft : [{ label: 'Cliente', value: '—' }]}
        right={visitRight.length > 0 ? visitRight : [{ label: 'Técnico', value: '—' }]}
      />

      <SectionTitle>Informe técnico</SectionTitle>
      <NarrativeField label="Hallazgos" value={data.findings} />
      <NarrativeField label="Actividades realizadas" value={data.activitiesPerformed} />
      <NarrativeField label="Recomendaciones" value={data.recommendations} />

      <ChecklistSection items={data.checklistItems} />

      {/* Firma */}
      <View style={s.signatureBlock}>
        <View style={s.signatureBox}>
          <Text style={s.signatureLabel}>Técnico responsable</Text>
          <Text style={s.signatureValue}>{data.technicianName ?? '___________________________'}</Text>
        </View>
        <View style={s.signatureBox}>
          <Text style={s.signatureLabel}>Firma del cliente</Text>
          <Text style={s.signatureValue}>
            {data.clientSignedAt ? `Firmado digitalmente\n${data.clientSignedAt}` : '___________________________'}
          </Text>
        </View>
      </View>

      <DocumentFooter generatedAt={data.generatedAt} />
    </PageLayout>
  );
}
