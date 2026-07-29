export interface ChecklistItemPdfDto {
  description: string;
  result: 'OK' | 'WARNING' | 'FAIL' | 'NA';
  notes: string | null;
}

export interface ServiceRecordPdfDto {
  // Identificación del documento
  workOrderNumber: string;
  workOrderTitle: string;
  workOrderType: string;
  generatedAt: string;

  // Fechas operativas
  scheduledAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  clientSignedAt: string | null;

  // Cliente y sede
  clientLegalName: string;
  clientTaxId: string | null;
  branchName: string | null;
  branchAddress: string | null;
  branchCity: string | null;

  // Técnico asignado
  technicianName: string | null;

  // Contenido técnico
  findings: string | null;
  activitiesPerformed: string | null;
  recommendations: string | null;
  checklistItems: ChecklistItemPdfDto[];
}
