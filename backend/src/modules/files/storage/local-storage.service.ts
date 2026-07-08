import { Injectable } from '@nestjs/common';
import { IStorageService } from './storage.interface';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class LocalStorageService implements IStorageService {
  private readonly baseDir: string;
  private readonly baseUrl: string;

  constructor() {
    this.baseDir = process.env.STORAGE_LOCAL_PATH ?? path.join(process.cwd(), 'uploads');
    this.baseUrl = process.env.STORAGE_BASE_URL ?? 'http://localhost:3000';
  }

  async save(buffer: Buffer, filename: string, subfolder: string): Promise<string> {
    const dir = path.join(this.baseDir, subfolder);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const storagePath = path.join(subfolder, filename).replace(/\\/g, '/');
    fs.writeFileSync(path.join(this.baseDir, storagePath), buffer);
    return storagePath;
  }

  getUrl(storagePath: string): string {
    return `${this.baseUrl}/files/serve/${storagePath}`;
  }

  async delete(storagePath: string): Promise<void> {
    const fullPath = path.join(this.baseDir, storagePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  }
}
