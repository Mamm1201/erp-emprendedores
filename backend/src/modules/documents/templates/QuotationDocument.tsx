import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { PageLayout } from '../base/PageLayout';
import { DocumentHeader } from '../base/DocumentHeader';
import { DocumentFooter } from '../base/DocumentFooter';
import { InfoGrid } from '../base/InfoGrid';
import { SectionTitle } from '../base/SectionTitle';
import { ItemsTable } from '../base/ItemsTable';
import { TotalsBlock } from '../base/TotalsBlock';
import { palette, sp, fs, COMPANY } from '../base/styles';
import type { QuotationPdfDto } from '../dto/quotation-pdf.dto';

const s = StyleSheet.create({
  statusBadge: {
    fontSize: fs.xs,
    color: palette.muted,
    marginBottom: sp.lg,
    textAlign: 'right',
  },
  noteBlock: {
    marginBottom: sp.md,
  },
  noteLabel: {
    fontSize: fs.xs,
    fontFamily: 'Helvetica-Bold',
    color: palette.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: sp.xs,
    paddingBottom: sp.xs,
    borderBottomWidth: 0.5,
    borderBottomColor: palette.border,
  },
  noteText: {
    fontSize: fs.base,
    color: palette.text,
    lineHeight: 1.55,
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
        contactEmail={COMPANY.emails.ventas}
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

      {(data.notes || data.terms || data.paymentTerms || data.warranty || data.additionalNotes) && (
        <>
          <SectionTitle>Notas y condiciones</SectionTitle>
          {data.notes && (
            <View style={s.noteBlock}>
              <Text style={s.noteLabel}>Notas del servicio</Text>
              <Text style={s.noteText}>{data.notes}</Text>
            </View>
          )}
          {data.terms && (
            <View style={s.noteBlock}>
              <Text style={s.noteLabel}>Condiciones comerciales</Text>
              <Text style={s.noteText}>{data.terms}</Text>
            </View>
          )}
          {data.paymentTerms && (
            <View style={s.noteBlock}>
              <Text style={s.noteLabel}>Forma de pago</Text>
              <Text style={s.noteText}>{data.paymentTerms}</Text>
            </View>
          )}
          {data.warranty && (
            <View style={s.noteBlock}>
              <Text style={s.noteLabel}>Garantía</Text>
              <Text style={s.noteText}>{data.warranty}</Text>
            </View>
          )}
          {data.additionalNotes && (
            <View style={s.noteBlock}>
              <Text style={s.noteLabel}>Observaciones adicionales</Text>
              <Text style={s.noteText}>{data.additionalNotes}</Text>
            </View>
          )}
        </>
      )}

      <DocumentFooter generatedAt={data.generatedAt} />
    </PageLayout>
  );
}
