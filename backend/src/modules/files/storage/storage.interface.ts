export interface IStorageService {
  save(buffer: Buffer, filename: string, subfolder: string): Promise<string>;
  getUrl(storagePath: string): string;
  delete(storagePath: string): Promise<void>;
}

export const STORAGE_SERVICE = 'STORAGE_SERVICE';
