import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Expense, ExpenseCategory } from '@/lib/types';

export interface ExpenseFormData {
  category: ExpenseCategory;
  description: string;
  amount: number;
  expenseDate?: string;
  vendorName?: string;
}

export function useExpenses(workOrderId: string | null) {
  return useQuery({
    queryKey: ['expenses', workOrderId],
    queryFn: () => api.get<Expense[]>(`/work-orders/${workOrderId}/expenses`),
    enabled: !!workOrderId,
    staleTime: 30 * 1000,
  });
}

export function useCreateExpense(workOrderId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ExpenseFormData) =>
      api.post<Expense>(`/work-orders/${workOrderId}/expenses`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['expenses', workOrderId] }),
  });
}

export function useUpdateExpense(workOrderId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ExpenseFormData> }) =>
      api.patch<Expense>(`/work-orders/${workOrderId}/expenses/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['expenses', workOrderId] }),
  });
}

export function useDeleteExpense(workOrderId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.delete<{ id: string; deletedAt: string }>(
        `/work-orders/${workOrderId}/expenses/${id}`,
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['expenses', workOrderId] }),
  });
}
