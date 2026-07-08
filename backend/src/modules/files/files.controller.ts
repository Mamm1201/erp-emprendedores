import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  Res,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { Request, Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { FilesService } from './files.service';
import { UploadFileDto } from './dto/upload-file.dto';
import { FileEntityType } from '../../generated/prisma/client';

@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  upload(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadFileDto,
    @Req() req: Request & { user: { id: string } },
  ) {
    return this.filesService.upload(file, dto, req.user.id);
  }

  @Get()
  findByEntity(
    @Query('entityType') entityType: FileEntityType,
    @Query('entityId') entityId: string,
  ) {
    return this.filesService.findByEntity(entityType, entityId);
  }

  @Get(':id/download')
  async download(
    @Param('id') id: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { storagePath, mimeType, originalName } =
      await this.filesService.getFileForDownload(id);
    const baseDir =
      process.env.STORAGE_LOCAL_PATH ?? path.join(process.cwd(), 'uploads');
    const fullPath = path.join(baseDir, storagePath);
    const stream = fs.createReadStream(fullPath);
    // inline: el navegador puede mostrar imágenes directamente; attachment: fuerza descarga
    const disposition = mimeType.startsWith('image/') ? 'inline' : 'attachment';
    res.set({
      'Content-Type': mimeType,
      'Content-Disposition': `${disposition}; filename="${originalName}"`,
    });
    return new StreamableFile(stream);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.filesService.delete(id);
  }
}
