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

  // Técnico asignado (responsable, planeación — WorkOrder.assignedToId)
  technicianName: string | null;

  // Ejecutores reales de la intervención (WorkOrder.technicians, T-16). Lista
  // derivada de la OT; el Acta/PDF no almacena esta información de forma
  // independiente.
  technicianNames: string[];

  // Contenido técnico
  findings: string | null;
  activitiesPerformed: string | null;
  recommendations: string | null;
  checklistItems: ChecklistItemPdfDto[];
}
