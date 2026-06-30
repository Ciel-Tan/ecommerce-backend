import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import {
  buildApiErrorPayload,
  extractFromHttpExceptionBody,
  payloadFromUnknownException,
} from '../helpers/api-error-response';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(AllExceptionFilter.name);
  }

  catch(exception: unknown, host: ArgumentsHost) {
    if (host.getType() !== 'http') return;

    const httpCtx = host.switchToHttp();
    const req = httpCtx.getRequest<Request>();
    const res = httpCtx.getResponse<Response>();

    const ctx = {
      requestId: (req.headers['x-request-id'] as string) ?? '',
      path: req.url,
    };

    // http exceptions (NotFoundException, BadRequestException, etc.)
    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      const rawErrorResponse = exception.getResponse();

      if (typeof rawErrorResponse === 'string') {
        res
          .status(statusCode)
          .json(
            buildApiErrorPayload(statusCode, rawErrorResponse, undefined, ctx),
          );

        return;
      }

      // resBody is an object
      const { message, error } = extractFromHttpExceptionBody(
        rawErrorResponse,
        exception.message,
      );

      res
        .status(statusCode)
        .json(buildApiErrorPayload(statusCode, message, error, ctx));

      return;
    }

    // unknown exceptions (database errors, 500 server errors, etc.)
    this.logger.error({
      msg: 'Unhandled.exception',
      requestId: ctx.requestId,
      path: ctx.path,
      error:
        exception instanceof Error ? exception.message : 'Unknown exception',
      stack: exception instanceof Error ? exception.stack : undefined,
    });

    // build error payload for unknown exceptions
    const payload = payloadFromUnknownException(exception, ctx);
    res.status(payload.statusCode).json(payload);
    return;
  }
}
