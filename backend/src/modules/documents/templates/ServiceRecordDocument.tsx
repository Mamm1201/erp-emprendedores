import React from 'react';
import { View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import { PageLayout } from '../base/PageLayout';
import { DocumentHeader } from '../base/DocumentHeader';
import { DocumentFooter } from '../base/DocumentFooter';
import { InfoGrid } from '../base/InfoGrid';
import { SectionTitle } from '../base/SectionTitle';
import { palette, sp, fs, COMPANY } from '../base/styles';
import type { ServiceRecordPdfDto, ChecklistItemPdfDto, ServiceRecordPhotoDto } from '../dto/service-record-pdf.dto';

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

const TYPE_LABEL: Record<string, string> = {
  PREVENTIVE: 'Preventivo',
  CORRECTIVE: 'Correctivo',
  INSPECTION: 'Inspección',
};

const s = StyleSheet.create({
  narrativeBlock: {
    marginBottom: sp.sm,
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
    lineHeight: 1.4,
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
  otTitle: {
    fontSize: fs.md,
    fontFamily: 'Helvetica-Bold',
    color: palette.dark,
    marginBottom: sp.xs,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: sp.sm,
  },
  photoCell: {
    width: '48%',
    marginBottom: sp.sm,
    aspectRatio: 4 / 3,
    borderWidth: 0.5,
    borderColor: palette.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  photoCellLeft: {
    marginRight: '4%',
  },
  photoImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
});

function NarrativeField({ label, value }: { label: string; value: string | null }) {
  // Un solo <Text> con parrafos largos separados por linea en blanco es
  // dificil de medir con precision para el paginador automatico de
  // react-pdf cerca del limite de una pagina (causa raiz de la
  // superposicion con el footer). Partir por parrafo en nodos <Text>
  // independientes le da al paginador bloques mas chicos y predecibles
  // para decidir el corte de pagina, sin cambiar el aspecto visual.
  const paragraphs = value
    ? value.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean)
    : [];
  return (
    <View style={s.narrativeBlock}>
      <Text style={s.narrativeLabel}>{label}</Text>
      {paragraphs.length > 0 ? (
        paragraphs.map((p, i) => (
          <Text
            key={i}
            style={[s.narrativeText, i < paragraphs.length - 1 ? { marginBottom: sp.sm } : {}]}
          >
            {p}
          </Text>
        ))
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

// Evidencia fotografica — cierra el documento, siempre despues del
// contenido tecnico. El Acta no incluye constancia/firma (eso ya se
// resuelve en el formato fisico firmado en sitio); sin fotos, no se
// renderiza nada — ni titulo ni espacio reservado, y el documento termina
// justo despues del ultimo bloque de contenido tecnico. Cada celda es de
// altura fija (no depende del contenido) para que la paginacion automatica
// sea predecible.
function PhotoEvidenceSection({ photos }: { photos: ServiceRecordPhotoDto[] }) {
  if (photos.length === 0) return null;
  return (
    <>
      {/* minPresenceAhead evita que el titulo quede huerfano al pie de una
          pagina (sin esto, react-pdf lo renderiza igual aunque no quede
          espacio real antes del footer). Solo el titulo esta protegido —
          las fotos siguen fluyendo libremente a paginas adicionales. */}
      <View wrap={false} minPresenceAhead={40}>
        <SectionTitle>Evidencia fotográfica</SectionTitle>
      </View>
      <View style={s.photoGrid}>
        {photos.map((photo, i) => (
          <View
            key={i}
            style={[s.photoCell, i % 2 === 0 ? s.photoCellLeft : {}]}
            wrap={false}
          >
            <Image src={{ data: photo.data, format: photo.format }} style={s.photoImage} />
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
    { label: 'Dirección', value: data.branchAddress },
    { label: 'Ciudad', value: data.branchCity },
  ].filter((f) => f.value);

  const visitRight = [
    { label: 'Tipo de mantenimiento', value: TYPE_LABEL[data.workOrderType] ?? data.workOrderType },
    { label: 'Técnico asignado', value: data.technicianName },
    { label: 'Fecha programada', value: data.scheduledAt },
    { label: 'Fecha de inicio', value: data.startedAt },
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

      <Text style={s.otTitle}>{data.workOrderTitle}</Text>

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

      {data.technicianNames.length > 0 && (
        <NarrativeField
          label="Técnicos que intervinieron"
          value={data.technicianNames.join(', ')}
        />
      )}

      <PhotoEvidenceSection photos={data.photos} />

      <DocumentFooter generatedAt={data.generatedAt} />
    </PageLayout>
  );
}
