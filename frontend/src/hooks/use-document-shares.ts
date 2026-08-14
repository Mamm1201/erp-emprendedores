import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { DocumentShareResult, DocumentShareType } from '@/lib/types';

interface CreateDocumentSharePayload {
  type: DocumentShareType;
  documentId: string;
}

export function useCreateDocumentShare() {
  return useMutation({
    mutationFn: (payload: CreateDocumentSharePayload) =>
      api.post<DocumentShareResult>('/document-shares', payload),
  });
}
