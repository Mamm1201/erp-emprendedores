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
import type { InvoicePdfDto } from '../dto/invoice-pdf.dto';

const STATUS_LABEL: Record<string, string> = {
  DRAFT:          'Borrador',
  ISSUED:         'Emitida',
  PARTIALLY_PAID: 'Pago parcial',
  PAID:           'Pagada',
  VOID:           'Anulada',
};

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

export function InvoiceDocument({ data }: { data: InvoicePdfDto }) {
  const clientLeft = [
    { label: 'Cliente', value: data.clientLegalName },
    { label: 'NIT / RUT', value: data.clientTaxId },
    { label: 'OT de referencia', value: data.workOrderNumber },
  ].filter((f) => f.value);

  const clientRight = [
    { label: 'Sede', value: data.branchName },
    { label: 'Dirección', value: data.branchAddress },
    { label: 'Ciudad', value: data.branchCity },
  ].filter((f) => f.value);

  return (
    <PageLayout>
      <DocumentHeader
        documentType="CUENTA DE COBRO"
        documentNumber={data.number}
        issueDate={data.issueDate}
        expiryLabel="Vencimiento"
        expiryDate={data.dueDate}
        contactEmail={COMPANY.emails.facturacion}
      />

      <Text style={s.statusBadge}>Estado: {STATUS_LABEL[data.status] ?? data.status}</Text>

      <InfoGrid
        title="Datos del cliente"
        left={clientLeft.length > 0 ? clientLeft : [{ label: 'Cliente', value: '—' }]}
        right={clientRight.length > 0 ? clientRight : [{ label: 'Sede', value: '—' }]}
      />

      <SectionTitle>Servicios prestados</SectionTitle>
      <ItemsTable items={data.items} />
      <TotalsBlock
        subtotal={data.subtotal}
        discountTotal={data.discountTotal}
        taxTotal={data.taxTotal}
        total={data.total}
      />

      {(data.notes || data.paymentTerms || data.warranty) && (
        <>
          <SectionTitle>Notas y condiciones</SectionTitle>
          {data.notes && (
            <View style={s.noteBlock}>
              <Text style={s.noteLabel}>Notas del servicio</Text>
              <Text style={s.noteText}>{data.notes}</Text>
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
        </>
      )}

      <DocumentFooter generatedAt={data.generatedAt} />
    </PageLayout>
  );
}
