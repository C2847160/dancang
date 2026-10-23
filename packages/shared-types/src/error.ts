/**
 * Error contract (contract layer, spec.md R2.1: error codes are cross-boundary data).
 * Type-only — no runtime logic, no runtime dependencies.
 */

/** Stable error codes returned by every API error response. */
export type ApiErrorCode =
  'VALIDATION_ERROR' | 'UNAUTHORIZED' | 'NOT_FOUND' | 'CONFLICT' | 'INTERNAL_ERROR';

/** Machine-readable description of one invalid field. */
export interface ApiErrorDetail {
  /** Dot-joined path of the offending field, e.g. "email" or "items.0.name". */
  path: string;
  message: string;
}

/** Uniform error envelope returned by the global error handler. */
export interface ApiErrorBody {
  error: {
    code: ApiErrorCode;
    message: string;
    details?: ApiErrorDetail[];
  };
}
