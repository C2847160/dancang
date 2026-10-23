/**
 * Cross-cutting error handling (spec.md R4: middlewares/ holds auth, error
 * handling and logging). Every failure leaves the API through here, so the
 * response envelope is identical for every route (spec.md R2.1).
 */
import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import type { ApiErrorBody, ApiErrorCode, ApiErrorDetail } from '@repo/shared-types';

/** Expected, typed failure raised by controllers/services. */
export class AppError extends Error {
  readonly statusCode: number;
  readonly code: ApiErrorCode;
  readonly details: ApiErrorDetail[] | undefined;

  constructor(statusCode: number, code: ApiErrorCode, message: string, details?: ApiErrorDetail[]) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

/** Maps zod issues onto the contract's flat, JSON-safe detail shape. */
export function toValidationDetails(error: ZodError): ApiErrorDetail[] {
  return error.issues.map((issue) => ({
    path: issue.path.join('.'),
    message: issue.message,
  }));
}

function buildBody(code: ApiErrorCode, message: string, details?: ApiErrorDetail[]): ApiErrorBody {
  const error: ApiErrorBody['error'] = { code, message };
  if (details !== undefined && details.length > 0) {
    error.details = details;
  }
  return { error };
}

/** 404 handler for unmatched routes — JSON, not Express' default HTML. */
export function notFoundHandler(_req: Request, res: Response<ApiErrorBody>): void {
  res.status(404).json(buildBody('NOT_FOUND', 'Route not found'));
}

/**
 * Terminal error middleware. Must keep the 4-argument signature: Express only
 * treats a handler as an error handler when `next` is declared.
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response<ApiErrorBody>,
  next: NextFunction,
): void {
  // A response already started streaming: hand back to Express, which closes
  // the connection instead of appending a second (broken) JSON body.
  if (res.headersSent) {
    next(err);
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json(buildBody(err.code, err.message, err.details));
    return;
  }

  if (err instanceof ZodError) {
    res
      .status(400)
      .json(buildBody('VALIDATION_ERROR', 'Request body is invalid', toValidationDetails(err)));
    return;
  }

  // Unexpected failure: log server-side, never leak internals to the client.
  console.error('[error] unhandled:', err);
  res.status(500).json(buildBody('INTERNAL_ERROR', 'Internal server error'));
}
