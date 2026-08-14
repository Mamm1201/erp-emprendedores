import { useState } from 'react';
import { Share2, Copy, Check, Loader2, MessageCircle, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useCreateDocumentShare } from '@/hooks/use-document-shares';
import type { DocumentShareResult, DocumentShareType } from '@/lib/types';

const DOCUMENT_LABEL: Record<DocumentShareType, string> = {
  QUOTATION: 'Cotización',
  INVOICE: 'Cuenta de cobro',
  SERVICE_RECORD: 'Acta técnica',
};

// Normaliza a formato wa.me (solo dígitos, con indicativo de país). Los
// teléfonos en este ERP se guardan sin indicativo (ej. "3160419559").
function toWhatsAppNumber(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('57') && digits.length >= 12) return digits;
  return `57${digits}`;
}

function buildMessage(type: DocumentShareType, documentNumber: string, url: string): string {
  return `Hola, te comparto ${DOCUMENT_LABEL[type].toLowerCase()} ${documentNumber} de STECH NODES: ${url}`;
}

interface ShareDocumentButtonProps {
  type: DocumentShareType;
  documentId: string;
  documentNumber: string;
}

export function ShareDocumentButton({ type, documentId, documentNumber }: ShareDocumentButtonProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const [share, setShare] = useState<DocumentShareResult | null>(null);
  const createShare = useCreateDocumentShare();

  function handleOpen() {
    setOpen(true);
    setCopied(false);
    setCopyError(false);
    // Reutiliza el enlace ya generado en esta pantalla — solo se crea un
    // snapshot nuevo si todavía no existe uno para esta sesión de la página.
    if (!share && !createShare.isPending) {
      createShare.mutate(
        { type, documentId },
        { onSuccess: (result) => setShare(result) },
      );
    }
  }

  async function handleCopy() {
    if (!share) return;
    try {
      await navigator.clipboard.writeText(share.url);
      setCopied(true);
      // Cierra despues de mostrar brevemente la confirmacion, igual que las
      // demas acciones del menu.
      setTimeout(() => {
        setCopied(false);
        setOpen(false);
      }, 1200);
    } catch {
      setCopyError(true);
    }
  }

  function handleChannelClick() {
    setOpen(false);
  }

  const message = share ? buildMessage(type, documentNumber, share.url) : '';
  const whatsappHref = share?.contact.phone
    ? `https://wa.me/${toWhatsAppNumber(share.contact.phone)}?text=${encodeURIComponent(message)}`
    : null;
  const mailHref = share?.contact.email
    ? `mailto:${share.contact.email}?subject=${encodeURIComponent(`STECH NODES - ${DOCUMENT_LABEL[type]} ${documentNumber}`)}&body=${encodeURIComponent(message)}`
    : null;

  return (
    <>
      <Button size="sm" variant="outline" className="gap-1.5" onClick={handleOpen}>
        <Share2 className="h-3.5 w-3.5" />
        Compartir
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Compartir {DOCUMENT_LABEL[type].toLowerCase()}</DialogTitle>
          </DialogHeader>

          {createShare.isPending && (
            <div className="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))] py-4">
              <Loader2 className="h-4 w-4 animate-spin" />
              Generando enlace…
            </div>
          )}

          {createShare.isError && (
            <p className="text-sm text-[hsl(var(--destructive))]">
              {(createShare.error as Error)?.message ?? 'No se pudo generar el enlace'}
            </p>
          )}

          {share && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 rounded-md border px-3 py-2 text-xs text-[hsl(var(--muted-foreground))] truncate">
                {share.url}
              </div>

              <div className="grid gap-2">
                <Button variant="outline" size="sm" className="gap-2 justify-start" onClick={handleCopy}>
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? 'Enlace copiado' : 'Copiar enlace'}
                </Button>

                {whatsappHref && (
                  <Button asChild variant="outline" size="sm" className="gap-2 justify-start">
                    <a href={whatsappHref} target="_blank" rel="noreferrer" onClick={handleChannelClick}>
                      <MessageCircle className="h-3.5 w-3.5" />
                      Enviar por WhatsApp
                    </a>
                  </Button>
                )}

                {mailHref && (
                  <Button asChild variant="outline" size="sm" className="gap-2 justify-start">
                    <a href={mailHref} onClick={handleChannelClick}>
                      <Mail className="h-3.5 w-3.5" />
                      Enviar por correo
                    </a>
                  </Button>
                )}
              </div>

              {copyError && (
                <p className="text-xs text-[hsl(var(--destructive))]">
                  No se pudo copiar automáticamente — selecciona el enlace manualmente.
                </p>
              )}

              {!share.contact.phone && !share.contact.email && (
                <p className="text-xs text-[hsl(var(--muted-foreground))]">
                  El cliente no tiene teléfono ni correo registrado — puedes copiar el enlace y enviarlo manualmente.
                </p>
              )}

              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                Válido hasta {new Date(share.expiresAt).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
