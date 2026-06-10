import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type {
  Invoice,
  InvoiceStatus,
  Payment,
  PaymentMethod,
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
  workOrderId: string;
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

interface InvoiceFilters {
  search?: string;
  status?: InvoiceStatus | '';
  clientId?: string;
  page?: number;
}

export function useInvoices(filters: InvoiceFilters = {}) {
  const params = new URLSearchParams({ page: String(filters.page ?? 1) });
  if (filters.search?.trim()) params.set('search', filters.search.trim());
  if (filters.status) params.set('status', filters.status);
  if (filters.clientId) params.set('clientId', filters.clientId);

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
    },
  });
}
