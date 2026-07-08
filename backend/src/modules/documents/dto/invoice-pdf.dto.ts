export interface InvoiceItemPdfDto {
  lineOrder: number;
  description: string;
  quantity: string;
  unitPrice: string;
  discountAmount: string;
  taxRate: string;
  lineSubtotal: string;
  lineTotal: string;
}

export interface InvoicePdfDto {
  number: string;
  status: string;
  issueDate: string;
  dueDate: string;

  clientLegalName: string;
  clientTaxId: string | null;

  branchName: string | null;
  branchAddress: string | null;
  branchCity: string | null;

  workOrderNumber: string | null;

  items: InvoiceItemPdfDto[];
  subtotal: string;
  discountTotal: string;
  taxTotal: string;
  total: string;

  notes: string | null;
  generatedAt: string;
}
