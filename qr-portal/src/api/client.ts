import type { EquipmentPublicDto } from './types';

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3000';

export class NotFoundError extends Error {}
export class NetworkError extends Error {}

export async function fetchEquipment(qrCode: string): Promise<EquipmentPublicDto> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/public/equipment/${encodeURIComponent(qrCode)}`);
  } catch {
    throw new NetworkError('No se pudo conectar con el servidor');
  }
  if (res.status === 404) throw new NotFoundError('QR no encontrado');
  if (!res.ok) throw new NetworkError(`Error del servidor: ${res.status}`);
  return res.json() as Promise<EquipmentPublicDto>;
}
