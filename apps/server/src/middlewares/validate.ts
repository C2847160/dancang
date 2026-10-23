/**
 * Request-body validation middleware (spec.md R4: controller层负责解析与校验,
 * this keeps the parsing step declarative and reusable across modules).
 * On success the parsed value replaces `req.body`, so controllers consume
 * already-normalised data instead of casting `req.body as SomeType`.
 */
import type { RequestHandler } from 'express';
import type { ZodType } from 'zod';
import { AppError, toValidationDetails } from './error-handler';

export function validateBody<T>(schema: ZodType<T>): RequestHandler {
  return (req, _res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      next(
        new AppError(
          400,
          'VALIDATION_ERROR',
          'Request body is invalid',
          toValidationDetails(result.error),
        ),
      );
      return;
    }
    req.body = result.data;
    next();
  };
}
