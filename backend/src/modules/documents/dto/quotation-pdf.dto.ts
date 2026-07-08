// DTO tipado que recibe la plantilla QuotationDocument.
// Desacoplado del modelo Prisma — el servicio hace la transformación.

export interface QuotationItemPdfDto {
  lineOrder: number;
  description: string;
  quantity: string;
  unitPrice: string;
  discountAmount: string;
  taxRate: string;
  lineSubtotal: string;
  lineTotal: string;
}

export interface QuotationPdfDto {
  // Identificación del documento
  number: string;
  status: string;
  issueDate: string;
  validUntil: string | null;

  // Cliente
  clientLegalName: string;
  clientTaxId: string | null;

  // Sede (opcional)
  branchName: string | null;
  branchAddress: string | null;
  branchCity: string | null;
  branchDepartment: string | null;
  branchContactName: string | null;
  branchContactPhone: string | null;

  // Ítems y totales (Prisma Decimal llega como string desde el servicio)
  items: QuotationItemPdfDto[];
  subtotal: string;
  discountTotal: string;
  taxTotal: string;
  total: string;

  // Contenido libre
  notes: string | null;
  terms: string | null;

  // Metadato de generación
  generatedAt: string;
}
