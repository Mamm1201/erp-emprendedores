import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { PageLayout } from '../base/PageLayout';
import { DocumentHeader } from '../base/DocumentHeader';
import { DocumentFooter } from '../base/DocumentFooter';
import { InfoGrid } from '../base/InfoGrid';
import { SectionTitle } from '../base/SectionTitle';
import { ItemsTable } from '../base/ItemsTable';
import { TotalsBlock } from '../base/TotalsBlock';
import { palette, sp, fs } from '../base/styles';
import type { QuotationPdfDto } from '../dto/quotation-pdf.dto';

const s = StyleSheet.create({
  notesRow: {
    flexDirection: 'row',
    gap: sp.xl,
    marginTop: sp.md,
  },
  notesCol: {
    flex: 1,
  },
  notesLabel: {
    fontSize: fs.xs,
    fontFamily: 'Helvetica-Bold',
    color: palette.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: sp.xs,
  },
  notesText: {
    fontSize: fs.base,
    color: palette.text,
    lineHeight: 1.5,
  },
  statusBadge: {
    fontSize: fs.xs,
    color: palette.muted,
    marginBottom: sp.lg,
    textAlign: 'right',
  },
});

const STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Borrador',
  SENT: 'Enviada',
  APPROVED: 'Aprobada',
  REJECTED: 'Rechazada',
  EXPIRED: 'Vencida',
  CONVERTED: 'Convertida a OT',
  CANCELLED: 'Cancelada',
};

export function QuotationDocument({ data }: { data: QuotationPdfDto }) {
  const clientLeft = [
    { label: 'Cliente', value: data.clientLegalName },
    { label: 'NIT / RUT', value: data.clientTaxId },
  ];

  const clientRight = [
    { label: 'Sede', value: data.branchName },
    { label: 'Ciudad', value: data.branchCity },
    { label: 'Departamento', value: data.branchDepartment },
    { label: 'Contacto', value: data.branchContactName },
    { label: 'Teléfono', value: data.branchContactPhone },
  ].filter((f) => f.value);

  const docRight = [
    { label: 'Estado', value: STATUS_LABEL[data.status] ?? data.status },
    { label: 'Dirección', value: data.branchAddress },
  ].filter((f) => f.value);

  return (
    <PageLayout>
      <DocumentHeader
        documentType="COTIZACIÓN"
        documentNumber={data.number}
        issueDate={data.issueDate}
        expiryLabel={data.validUntil ? 'Válida hasta' : undefined}
        expiryDate={data.validUntil ?? undefined}
      />

      <InfoGrid
        title="Información del cliente"
        left={[...clientLeft, ...docRight]}
        right={clientRight.length > 0 ? clientRight : [{ label: 'Sede', value: 'Sin sede específica' }]}
      />

      <SectionTitle>Ítems de la cotización</SectionTitle>
      <ItemsTable items={data.items} />
      <TotalsBlock
        subtotal={data.subtotal}
        discountTotal={data.discountTotal}
        taxTotal={data.taxTotal}
        total={data.total}
      />

      {(data.notes || data.terms) && (
        <>
          <SectionTitle>Notas y condiciones</SectionTitle>
          <View style={s.notesRow}>
            {data.notes && (
              <View style={s.notesCol}>
                <Text style={s.notesLabel}>Notas</Text>
                <Text style={s.notesText}>{data.notes}</Text>
              </View>
            )}
            {data.terms && (
              <View style={s.notesCol}>
                <Text style={s.notesLabel}>Términos y condiciones</Text>
                <Text style={s.notesText}>{data.terms}</Text>
              </View>
            )}
          </View>
        </>
      )}

      <DocumentFooter generatedAt={data.generatedAt} />
    </PageLayout>
  );
}
