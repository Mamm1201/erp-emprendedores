import { NetworkError, NotFoundError } from './client';
import type { AccreditationPublicDto } from './types';

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3000';
const FETCH_TIMEOUT_MS = 10_000;

export async function fetchAccreditation(qrCode: string): Promise<AccreditationPublicDto> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(`${API_BASE}/public/accreditation/${encodeURIComponent(qrCode)}`, {
      signal: controller.signal,
    });
  } catch {
    throw new NetworkError('No se pudo conectar con el servidor');
  } finally {
    clearTimeout(timeoutId);
  }
  if (res.status === 404) throw new NotFoundError('QR no encontrado');
  if (!res.ok) throw new NetworkError(`Error del servidor: ${res.status}`);
  return res.json() as Promise<AccreditationPublicDto>;
}
