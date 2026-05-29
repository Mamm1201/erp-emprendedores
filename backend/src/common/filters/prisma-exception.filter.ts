import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { Prisma } from '../../generated/prisma/client';
import { HTTP_ERROR_PHRASES } from '../constants/http-error.constants';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(
    exception: Prisma.PrismaClientKnownRequestError,
    host: ArgumentsHost,
  ): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const statusCode = this.resolveStatusCode(exception.code);
    const message = this.resolveMessage(exception);
    const error =
      HTTP_ERROR_PHRASES[statusCode] ?? 'Internal Server Error';

    if (statusCode === HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `Prisma ${exception.code}: ${exception.message}`,
        exception.stack,
      );
    }

    response.status(statusCode).json({
      statusCode,
      message,
      error,
    });
  }

  private resolveStatusCode(code: string): number {
    switch (code) {
      case 'P2002':
        return HttpStatus.CONFLICT;
      case 'P2025':
        return HttpStatus.NOT_FOUND;
      case 'P2003':
        return HttpStatus.BAD_REQUEST;
      default:
        return HttpStatus.INTERNAL_SERVER_ERROR;
    }
  }

  private resolveMessage(
    exception: Prisma.PrismaClientKnownRequestError,
  ): string {
    switch (exception.code) {
      case 'P2002':
        return this.uniqueConstraintMessage(exception);
      case 'P2025':
        return 'The requested record was not found';
      case 'P2003':
        return this.foreignKeyMessage(exception);
      default:
        return 'An unexpected database error occurred';
    }
  }

  private uniqueConstraintMessage(
    exception: Prisma.PrismaClientKnownRequestError,
  ): string {
    const target = exception.meta?.target;

    if (Array.isArray(target) && target.length > 0) {
      return `A record with the same value already exists for: ${target.join(', ')}`;
    }

    if (typeof target === 'string' && target.length > 0) {
      return `A record with the same value already exists for: ${target}`;
    }

    return 'A record with the same unique value already exists';
  }

  private foreignKeyMessage(
    exception: Prisma.PrismaClientKnownRequestError,
  ): string {
    const field = exception.meta?.field_name;

    if (typeof field === 'string' && field.length > 0) {
      return `Invalid reference: related record does not exist (${field})`;
    }

    return 'Invalid reference: related record does not exist';
  }
}
