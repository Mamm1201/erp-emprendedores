import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { DocumentsModule } from '../documents/documents.module';
import { FilesModule } from '../files/files.module';
import { DocumentSharesController } from './document-shares.controller';
import { PublicDocumentsController } from './public-documents.controller';
import { DocumentSharesService } from './document-shares.service';

@Module({
  imports: [PrismaModule, DocumentsModule, FilesModule],
  controllers: [DocumentSharesController, PublicDocumentsController],
  providers: [DocumentSharesService],
})
export class DocumentSharesModule {}
