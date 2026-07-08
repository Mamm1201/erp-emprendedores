import { useNavigate } from 'react-router-dom';
import { ShieldX } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ForbiddenPage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center px-4">
      <ShieldX className="h-16 w-16 text-muted-foreground/40" />
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-foreground">Acceso denegado</h1>
        <p className="text-sm text-muted-foreground max-w-sm">
          No tienes permiso para acceder a esta sección. Contacta al administrador si crees
          que esto es un error.
        </p>
      </div>
      <Button variant="outline" onClick={() => navigate('/')}>
        Volver al Dashboard
      </Button>
    </div>
  );
}
