export interface IStorageService {
  save(buffer: Buffer, filename: string, subfolder: string): Promise<string>;
  getUrl(storagePath: string): string;
  delete(storagePath: string): Promise<void>;
  // Lee el contenido binario del archivo. Uso interno del backend (ej.
  // incrustar evidencia fotografica en un PDF) — nunca expuesto por HTTP.
  read(storagePath: string): Promise<Buffer>;
}

export const STORAGE_SERVICE = 'STORAGE_SERVICE';
