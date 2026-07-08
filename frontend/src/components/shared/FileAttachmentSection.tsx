import { useRef, useState } from 'react';
import { Download, Trash2, Upload, FileText, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getApiToken } from '@/lib/api';
import { useFiles, useUploadFile, useDeleteFile } from '@/hooks/use-files';
import type { FileAttachment, FileEntityType, FileCategory } from '@/lib/types';

const CATEGORY_LABELS: Record<FileCategory, string> = {
  PHOTO: 'Foto',
  DOCUMENT: 'Documento',
  CERTIFICATE: 'Certificado',
  MANUAL: 'Manual',
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileIcon({ mimeType }: { mimeType: string }) {
  if (mimeType.startsWith('image/')) return <Image className="h-4 w-4" />;
  return <FileText className="h-4 w-4" />;
}

async function downloadFile(attachment: FileAttachment) {
  const token = getApiToken();
  const res = await fetch(attachment.url, {
    credentials: 'include',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  if (!res.ok) return;
  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = objectUrl;
  a.download = attachment.originalName;
  a.click();
  URL.revokeObjectURL(objectUrl);
}

interface FileRowProps {
  attachment: FileAttachment;
  onDelete: (id: string) => void;
  deleting: boolean;
}

function FileRow({ attachment, onDelete, deleting }: FileRowProps) {
  return (
    <div className="flex items-center gap-3 rounded-md border p-3 text-sm">
      <FileIcon mimeType={attachment.mimeType} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{attachment.originalName}</p>
        <p className="text-muted-foreground text-xs">
          {CATEGORY_LABELS[attachment.category]} · {formatBytes(attachment.sizeBytes)} ·{' '}
          {new Date(attachment.createdAt).toLocaleDateString('es-CO')}
        </p>
        {attachment.description && (
          <p className="text-muted-foreground mt-0.5 truncate text-xs">{attachment.description}</p>
        )}
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="text-muted-foreground hover:text-foreground shrink-0 h-8 w-8"
        onClick={() => downloadFile(attachment)}
        title="Descargar"
      >
        <Download className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="text-muted-foreground hover:text-destructive shrink-0 h-8 w-8"
        onClick={() => onDelete(attachment.id)}
        disabled={deleting}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

interface Props {
  entityType: FileEntityType;
  entityId: string;
  defaultCategory?: FileCategory;
  label?: string;
}

export function FileAttachmentSection({
  entityType,
  entityId,
  defaultCategory = 'PHOTO',
  label = 'Adjuntos',
}: Props) {
  const { data: files = [], isLoading } = useFiles(entityType, entityId);
  const upload = useUploadFile(entityType, entityId);
  const remove = useDeleteFile(entityType, entityId);
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedCategory, setSelectedCategory] = useState<FileCategory>(defaultCategory);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    upload.mutate({ file, entityType, entityId, category: selectedCategory });
    e.target.value = '';
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">{label} ({files.length})</h4>
        <div className="flex items-center gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as FileCategory)}
            className="border-input bg-background text-foreground rounded-md border px-2 py-1 text-xs"
          >
            {(Object.keys(CATEGORY_LABELS) as FileCategory[]).map((k) => (
              <option key={k} value={k}>
                {CATEGORY_LABELS[k]}
              </option>
            ))}
          </select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
            disabled={upload.isPending}
          >
            <Upload className="mr-1 h-3 w-3" />
            {upload.isPending ? 'Subiendo…' : 'Adjuntar'}
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic,application/pdf"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      </div>

      {upload.isError && (
        <p className="text-destructive text-xs">
          {(upload.error as Error)?.message ?? 'Error al subir el archivo'}
        </p>
      )}

      {isLoading && <p className="text-muted-foreground text-xs">Cargando…</p>}

      {!isLoading && files.length === 0 && (
        <p className="text-muted-foreground rounded-md border border-dashed p-4 text-center text-xs">
          Sin {label.toLowerCase()}. Sube fotos, certificados o documentos.
        </p>
      )}

      <div className="space-y-2">
        {files.map((f) => (
          <FileRow
            key={f.id}
            attachment={f}
            onDelete={(id) => remove.mutate(id)}
            deleting={remove.isPending}
          />
        ))}
      </div>
    </div>
  );
}
