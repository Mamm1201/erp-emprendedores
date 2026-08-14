import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { DocumentShareType } from '../../../generated/prisma/client';

export class CreateDocumentShareDto {
  @IsEnum(DocumentShareType)
  type: DocumentShareType;

  // Id del documento origen. Para SERVICE_RECORD es el workOrderId (mismo
  // parametro que ya usa /documents/work-orders/:workOrderId/service-record/pdf).
  @IsString()
  @IsNotEmpty()
  documentId: string;
}
