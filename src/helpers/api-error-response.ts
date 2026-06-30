import { HttpStatus } from '@nestjs/common';

export type ApiErrorPayload = {
  success: false;
  statusCode: number;
  message: string;
  error?: string;
  requestId: string;
  timestamp: string;
  path: string;
};

export type ApiErrorContext = {
  requestId: string;
  path: string;
};

export function buildApiErrorPayload(
  statusCode: number,
  message: string | string[],
  error: string | undefined,
  ctx: ApiErrorContext,
): ApiErrorPayload {
  return {
    success: false,
    statusCode,
    message: formatClientErrorMessage(message),
    requestId: ctx.requestId,
    timestamp: new Date().toISOString(),
    path: ctx.path,
    error: error ?? '',
  };
}

const formatClientErrorMessage = (message: string | string[]) => {
  if (Array.isArray(message)) {
    return message
      .map((m) => String(m).trim())
      .filter(Boolean)
      .join(' ');
  }
  return String(message);
};

// extract error and message from error response
type NestHttpErrorBody = {
  message?: string | string[];
  error?: string;
  statusCode?: number;
};

export function extractFromHttpExceptionBody(
  body: Record<string, unknown> | NestHttpErrorBody,
  fallbackMessage: string,
) {
  const b = body as NestHttpErrorBody;
  const message = b.message != undefined ? b.message : fallbackMessage;

  const error =
    typeof b.error === 'string' && b.error !== '' ? b.error : undefined;
  return { message, error };
}

// unknown exception
export function payloadFromUnknownException(
  exception: unknown,
  ctx: ApiErrorContext,
): ApiErrorPayload {
  // todo: translate error message

  const prod = process.env.NODE_ENV === 'production';
  if (exception instanceof Error) {
    return buildApiErrorPayload(
      HttpStatus.INTERNAL_SERVER_ERROR,
      prod ? 'Internal server error' : exception.message,
      'Internal Server Error',
      ctx,
    );
  }

  return buildApiErrorPayload(
    HttpStatus.INTERNAL_SERVER_ERROR,
    'Internal server error',
    'Internal Server Error',
    ctx,
  );
}
