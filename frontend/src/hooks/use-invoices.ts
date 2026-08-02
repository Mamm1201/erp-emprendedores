import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type {
  FinancialSummary,
  Invoice,
  InvoiceStatus,
  Payment,
  PaymentMethod,
  PaymentWithInvoice,
  PaginatedResponse,
} from '@/lib/types';

export interface InvoiceItemFormData {
  lineOrder?: number;
  description: string;
  quantity: number;
  unitPrice: number;
  discountAmount?: number;
  taxRate?: number;
}

export interface CreateInvoiceData {
  workOrderId?: string;
  contractId?: string;
  dueDate: string;
  notes?: string;
  items?: InvoiceItemFormData[];
}

export interface UpdateInvoiceData {
  dueDate?: string;
  notes?: string;
  items?: InvoiceItemFormData[];
}

export interface CreatePaymentData {
  amount: number;
  paidAt?: string;
  method?: PaymentMethod;
  reference?: string;
  notes?: string;
}

export type InvoiceAging = 'NOT_DUE' | 'D1_30' | 'D31_60' | 'D61_90' | 'D90_PLUS';

interface InvoiceFilters {
  search?: string;
  status?: InvoiceStatus | '';
  clientId?: string;
  contractId?: string;
  aging?: InvoiceAging | '';
  page?: number;
}

export function useInvoices(filters: InvoiceFilters = {}) {
  const params = new URLSearchParams({ page: String(filters.page ?? 1) });
  if (filters.search?.trim()) params.set('search', filters.search.trim());
  if (filters.status) params.set('status', filters.status);
  if (filters.clientId) params.set('clientId', filters.clientId);
  if (filters.contractId) params.set('contractId', filters.contractId);
  if (filters.aging) params.set('aging', filters.aging);

  return useQuery({
    queryKey: ['invoices', filters],
    queryFn: () => api.get<PaginatedResponse<Invoice>>(`/invoices?${params}`),
    staleTime: 60 * 1000,
    placeholderData: (prev) => prev,
  });
}

export function useInvoice(id: string | null) {
  return useQuery({
    queryKey: ['invoices', id],
    queryFn: () => api.get<Invoice>(`/invoices/${id}`),
    enabled: !!id,
    staleTime: 30 * 1000,
  });
}

export function useCreateInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateInvoiceData) => api.post<Invoice>('/invoices', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['invoices'] });
      qc.invalidateQueries({ queryKey: ['work-orders'] });
      qc.invalidateQueries({ queryKey: ['maintenance-contracts'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useUpdateInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateInvoiceData }) =>
      api.patch<Invoice>(`/invoices/${id}`, data),
    onSuccess: (_r, vars) => {
      qc.invalidateQueries({ queryKey: ['invoices'] });
      qc.invalidateQueries({ queryKey: ['invoices', vars.id] });
    },
  });
}

export function useUpdateInvoiceStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      status,
      voidReason,
    }: {
      id: string;
      status: InvoiceStatus;
      voidReason?: string;
    }) => api.patch<Invoice>(`/invoices/${id}/status`, { status, voidReason }),
    onSuccess: (_r, vars) => {
      qc.invalidateQueries({ queryKey: ['invoices'] });
      qc.invalidateQueries({ queryKey: ['invoices', vars.id] });
      qc.invalidateQueries({ queryKey: ['work-orders'] });
    },
  });
}

export function useCreatePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      invoiceId,
      data,
    }: {
      invoiceId: string;
      data: CreatePaymentData;
    }) => api.post<Payment>(`/invoices/${invoiceId}/payments`, data),
    onSuccess: (_r, vars) => {
      qc.invalidateQueries({ queryKey: ['invoices', vars.invoiceId] });
      qc.invalidateQueries({ queryKey: ['invoices'] });
      qc.invalidateQueries({ queryKey: ['work-orders'] });
    },
  });
}

export function useVoidPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      invoiceId,
      paymentId,
      voidReason,
    }: {
      invoiceId: string;
      paymentId: string;
      voidReason?: string;
    }) =>
      api.patch<Payment>(
        `/invoices/${invoiceId}/payments/${paymentId}/void`,
        { voidReason },
      ),
    onSuccess: (_r, vars) => {
      qc.invalidateQueries({ queryKey: ['invoices', vars.invoiceId] });
      qc.invalidateQueries({ queryKey: ['invoices'] });
      qc.invalidateQueries({ queryKey: ['payments'] });
      qc.invalidateQueries({ queryKey: ['invoices-summary'] });
    },
  });
}

// ─── Payments list ────────────────────────────────────────────────────────────

interface PaymentFilters {
  page?: number;
  method?: PaymentMethod | '';
  fromDate?: string;
  toDate?: string;
  clientId?: string;
  includeVoided?: boolean;
}

export function useAllPayments(filters: PaymentFilters = {}) {
  const params = new URLSearchParams({ page: String(filters.page ?? 1) });
  if (filters.method) params.set('method', filters.method);
  if (filters.fromDate) params.set('fromDate', filters.fromDate);
  if (filters.toDate) params.set('toDate', filters.toDate);
  if (filters.clientId) params.set('clientId', filters.clientId);
  if (filters.includeVoided) params.set('includeVoided', 'true');

  return useQuery({
    queryKey: ['payments', filters],
    queryFn: () =>
      api.get<PaginatedResponse<PaymentWithInvoice>>(
        `/invoices/payments?${params}`,
      ),
    staleTime: 60 * 1000,
    placeholderData: (prev) => prev,
  });
}

// ─── Financial summary ────────────────────────────────────────────────────────

export function useFinancialSummary() {
  return useQuery({
    queryKey: ['invoices-summary'],
    queryFn: () => api.get<FinancialSummary>('/invoices/summary'),
    staleTime: 2 * 60 * 1000,
  });
}
