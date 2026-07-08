import { Module } from '@nestjs/common';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { LocalStorageService } from './storage/local-storage.service';
import { STORAGE_SERVICE } from './storage/storage.interface';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [FilesController],
  providers: [
    FilesService,
    { provide: STORAGE_SERVICE, useClass: LocalStorageService },
  ],
})
export class FilesModule {}
