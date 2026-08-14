import { Body, Controller, Post, Req } from '@nestjs/common';
import { Request } from 'express';
import { DocumentSharesService } from './document-shares.service';
import { CreateDocumentShareDto } from './dto/create-document-share.dto';

@Controller('document-shares')
export class DocumentSharesController {
  constructor(private readonly documentSharesService: DocumentSharesService) {}

  @Post()
  create(
    @Body() dto: CreateDocumentShareDto,
    @Req() req: Request & { user: { id: string } },
  ) {
    return this.documentSharesService.create(dto, req.user.id);
  }
}
