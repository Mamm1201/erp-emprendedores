import { Construction } from 'lucide-react';

export function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] text-center">
      <Construction className="h-12 w-12 text-[hsl(var(--muted-foreground))] mb-4" />
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="text-sm text-[hsl(var(--muted-foreground))] mt-2">
        Esta sección está en desarrollo.
      </p>
    </div>
  );
}
