import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function SaveableTextarea({
  label,
  initialValue,
  onSave,
  disabled,
}: {
  label: string;
  initialValue: string;
  onSave: (value: string) => Promise<void>;
  disabled?: boolean;
}) {
  const [value, setValue]     = useState(initialValue);
  const [dirty, setDirty]     = useState(false);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      await onSave(value);
      setDirty(false);
    } catch (err) {
      // No limpiamos `dirty` — el texto sigue sin guardarse y el botón
      // "Guardar" debe seguir visible para que el usuario pueda reintentar.
      setError((err as Error)?.message ?? 'No se pudo guardar. Intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wide">
          {label}
        </p>
        {dirty && (
          <Button
            size="sm"
            variant="outline"
            className="h-6 text-xs px-2"
            onClick={handleSave}
            disabled={saving || disabled}
          >
            {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Guardar'}
          </Button>
        )}
      </div>
      <textarea
        className="w-full min-h-[80px] rounded-md border bg-transparent px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] disabled:opacity-50"
        value={value}
        onChange={(e) => { setValue(e.target.value); setDirty(true); setError(null); }}
        disabled={disabled}
        placeholder={`Ingresa ${label.toLowerCase()}…`}
        rows={3}
      />
      {error && (
        <p className="text-xs text-[hsl(var(--destructive))]">{error}</p>
      )}
    </div>
  );
}
