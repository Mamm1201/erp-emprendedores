import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, getApiToken } from '@/lib/api';
import type { FileAttachment, FileEntityType, FileCategory } from '@/lib/types';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export function useFiles(entityType: FileEntityType, entityId: string) {
  return useQuery<FileAttachment[]>({
    queryKey: ['files', entityType, entityId],
    queryFn: () =>
      api.get<FileAttachment[]>(
        `/files?entityType=${entityType}&entityId=${entityId}`,
      ),
    enabled: !!entityId,
    staleTime: 30_000,
  });
}

interface UploadPayload {
  file: File;
  entityType: FileEntityType;
  entityId: string;
  category: FileCategory;
  description?: string;
  takenAt?: string;
}

export function useUploadFile(entityType: FileEntityType, entityId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ file, ...dto }: UploadPayload) => {
      const form = new FormData();
      form.append('file', file);
      form.append('entityType', dto.entityType);
      form.append('entityId', dto.entityId);
      form.append('category', dto.category);
      if (dto.description) form.append('description', dto.description);
      if (dto.takenAt) form.append('takenAt', dto.takenAt);

      const token = getApiToken();
      const res = await fetch(`${BASE_URL}/files/upload`, {
        method: 'POST',
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: form,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          (body as { message?: string }).message ?? `HTTP ${res.status}`,
        );
      }
      return res.json() as Promise<FileAttachment>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files', entityType, entityId] });
    },
  });
}

export function useDeleteFile(entityType: FileEntityType, entityId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/files/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files', entityType, entityId] });
    },
  });
}
