import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { CORRELATION_ID_HEADER } from '../constants/correlation-id';

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const existing = req.headers[CORRELATION_ID_HEADER];

    const requestId = existing ?? randomUUID();

    req.headers[CORRELATION_ID_HEADER] = requestId;
    res.setHeader(CORRELATION_ID_HEADER, requestId);

    next();
  }
}
