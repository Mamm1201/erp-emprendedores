import type { ExpenseCategory } from '@/lib/types';

export const CATEGORY_LABEL: Record<ExpenseCategory, string> = {
  MATERIALS:   'Materiales',
  LABOR:       'Mano de obra',
  TRANSPORT:   'Transporte',
  TOOLS:       'Herramientas',
  SUBCONTRACT: 'Subcontratos',
  OFFICE:      'Oficina / Admin',
  OTHER:       'Otros',
};

export const CATEGORY_ORDER: ExpenseCategory[] = [
  'MATERIALS', 'LABOR', 'TRANSPORT', 'TOOLS', 'SUBCONTRACT', 'OFFICE', 'OTHER',
];
