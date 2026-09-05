import { Module } from '@nestjs/common';
import { DocumentsModule } from '../documents/documents.module';
import { AccreditationsController } from './accreditations.controller';
import { AccreditationCardController } from './accreditation-card.controller';
import { AccreditationsService } from './accreditations.service';

@Module({
  imports: [DocumentsModule],
  controllers: [AccreditationsController, AccreditationCardController],
  providers: [AccreditationsService],
  exports: [AccreditationsService],
})
export class AccreditationsModule {}
