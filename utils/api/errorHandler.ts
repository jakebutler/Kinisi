import { NextResponse, NextRequest } from 'next/server';

export interface ApiError {
  message: string;
  code?: string;
  status: number;
}

/**
 * Standardized API error responses
 */
export const ApiErrors = {
  unauthorized: (message = 'Unauthorized'): ApiError => ({
    message,
    code: 'UNAUTHORIZED',
    status: 401
  }),

  forbidden: (message = 'Forbidden'): ApiError => ({
    message,
    code: 'FORBIDDEN',
    status: 403
  }),

  notFound: (message = 'Resource not found'): ApiError => ({
    message,
    code: 'NOT_FOUND',
    status: 404
  }),

  validation: (message = 'Invalid input'): ApiError => ({
    message,
    code: 'VALIDATION_ERROR',
    status: 400
  }),

  invalidJson: (message = 'Invalid JSON in request body'): ApiError => ({
    message,
    code: 'INVALID_JSON',
    status: 400
  }),

  serverError: (message = 'Internal server error'): ApiError => ({
    message,
    code: 'SERVER_ERROR',
    status: 500
  }),

  serviceUnavailable: (message = 'Service temporarily unavailable'): ApiError => ({
    message,
    code: 'SERVICE_UNAVAILABLE',
    status: 502
  }),

  unprocessableEntity: (message = 'Unprocessable entity'): ApiError => ({
    message,
    code: 'UNPROCESSABLE_ENTITY',
    status: 422
  })
} as const;

/**
 * Creates a standardized API error response
 */
export function createErrorResponse(error: ApiError | Error | string): NextResponse {
  if (typeof error === 'string') {
    const apiError = ApiErrors.serverError(error);
    return NextResponse.json({
      error: apiError.message,
      code: apiError.code
    }, { status: apiError.status });
  }

  if (error instanceof Error) {
    const apiError = ApiErrors.serverError(error.message);
    return NextResponse.json({
      error: apiError.message,
      code: apiError.code
    }, { status: apiError.status });
  }

  return NextResponse.json({
    error: error.message,
    code: error.code
  }, { status: error.status });
}

/**
 * Wraps async API route handlers with error handling
 */
export function withErrorHandling(handler: (req: NextRequest, ...args: any[]) => Promise<Response>) {
  return async (req: NextRequest, ...args: any[]): Promise<Response> => {
    try {
      return await handler(req, ...args);
    } catch (error) {
      console.error('API Error:', error);
      return createErrorResponse(error as Error | ApiError | string);
    }
  };
}