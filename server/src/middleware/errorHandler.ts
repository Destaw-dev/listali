import { Request, Response, NextFunction } from 'express';
import { IApiResponse, IApiError } from '../types';

export class AppError extends Error {
  statusCode: number;
  status: string;
  isOperational: boolean;
  isEmailVerified?: boolean;

  constructor(message: string, statusCode: number, isEmailVerified: boolean = false) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    this.isEmailVerified = isEmailVerified;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const asyncHandler = (
    fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
  ) =>
    (req: Request, res: Response, next: NextFunction) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };

const handleDuplicateKeyError = (err: any): AppError => {
    const field = Object.keys(err?.keyValue || {})[0];
    if (field) {
    const value = err.keyValue[field];
    const message = `${field} '${value}' already exists. Please use a different ${field}.`;
    return new AppError(message, 400);
    } else {
    return new AppError('Duplicate field already exists.', 400);
    }
//   const field = Object.keys(err.keyValue)[0];
//   const value = err.keyValue[field];
//   const message = `${field} '${value}' already exists. Please use a different ${field}.`;
//   return new AppError(message, 400);
};

const handleValidationError = (err: any): AppError => {
  const errors = Object.values(err.errors).map((val: any) => val.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const handleCastError = (err: any): AppError => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleJWTError = (): AppError => 
  new AppError('Invalid token. Please log in again.', 401);

const handleJWTExpiredError = (): AppError =>
  new AppError('Your token has expired. Please log in again.', 401);

const sendErrorDev = (err: any, res: Response<IApiResponse>): void => {
  res.status(err.statusCode || 500).json({
    success: false,
    error: err.message,
    message: err.message,
    stack: err.stack,
    details: {
      name: err.name,
      statusCode: err.statusCode,
      isOperational: err.isOperational,
    },
    isEmailVerified: err.isEmailVerified
  });
};

const sendErrorProd = (err: any, res: Response<IApiResponse>): void => {
  if (err.isOperational) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      isEmailVerified: err.isEmailVerified
    });
  } else {
    console.error('ERROR 💥:', err);

    res.status(500).json({
      success: false,
      message: 'Something went wrong on our end. Please try again later.'
    });
  }
};

export const errorHandler = (
  err: any,
  req: Request,
  res: Response<IApiResponse>,
  _next: NextFunction
): void => {
  let error = { ...err };
  error.message = err.message;

  console.error(`🚨 Error: ${err.message}`);
  console.error(`📍 URL: ${req.method} ${req.originalUrl}`);
  console.error(`👤 User: ${req.user?.id || 'unauthenticated'}`);
  
  if (process.env.NODE_ENV === 'development') {
    console.error('📚 Stack:', err.stack);
  }

  error.statusCode = error.statusCode || 500;
  error.status = error.status || 'error';

  if (err.code === 11000) {
    error = handleDuplicateKeyError(err);
  }

  if (err.name === 'ValidationError') {
    error = handleValidationError(err);
  }

  if (err.name === 'CastError') {
    error = handleCastError(err);
  }

  if (err.name === 'JsonWebTokenError') {
    error = handleJWTError();
  }

  if (err.name === 'TokenExpiredError') {
    error = handleJWTExpiredError();
  }

  if (err instanceof AppError) {
    error.statusCode = err.statusCode;
    error.status = err.status;
    error.message = err.message;
    error.isOperational = err.isOperational;
    error.isEmailVerified = err.isEmailVerified;
    console.log('error.isEmailVerified', error.isEmailVerified, err);
  }

  if (err instanceof Error && !err.message) {
    error.statusCode = 500;
    error.status = 'error';
    error.message = err.message || 'Internal server error';
    error.isOperational = false;
  }

  if (res.headersSent) {
    console.error('🚨 Response already sent, cannot send error');
    return;
  }

  try {
    if (process.env.NODE_ENV === 'development') {
      sendErrorDev(error, res);
    } else {
      sendErrorProd(error, res);
    }
  } catch (sendError) {
    console.error('🚨 Failed to send error response:', sendError);
    
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const notFound = (req: Request, res: Response<IApiResponse>): void => {
  const message = `Route ${req.originalUrl} not found`;
  res.status(404).json({
    success: false,
    message
  });
};

export const validationErrorResponse = (errors: any[]): IApiResponse => {
  const errorMessages = errors.reduce((acc, error) => {
    acc[error.path || error.param] = error.msg;
    return acc;
  }, {});

  return {
    success: false,
    message: 'Validation errors occurred',
    errors: errorMessages
  };
};

export const successResponse = <T>(
  data?: T,
  message?: string,
  pagination?: any
): IApiResponse<T> => {
  const response: IApiResponse<T> = {
    success: true
  };

  if (data !== undefined) {
    response.data = data;
  }

  if (message) {
    response.message = message;
  }

  if (pagination) {
    response.pagination = pagination;
  }

  return response;
};

export const errorResponse = (message: string, statusCode: number = 400, stack: string = ""): IApiResponse<null> => ({
  success: false,
  message,
  data: null,
  stack,
  details: {
    name: 'Error',
    statusCode,
    isOperational: true
  }
});

export const errorResponseOne = (
  message: string,
  statusCode: number = 500,
  errors?: Record<string, string>
): IApiError => {
  const response: IApiError = {
    message,
    statusCode
  };

  if (errors) {
    response.errors = errors;
  }

  return response;
};

export const getPagination = (
  page: number = 1,
  limit: number = 10,
  total: number
) => {
  const totalPages = Math.ceil(total / limit);
  const currentPage = Math.max(1, Math.min(page, totalPages));
  const skip = (currentPage - 1) * limit;

  return {
    pagination: {
      page: currentPage,
      limit,
      total,
      pages: totalPages,
      hasNext: currentPage < totalPages,
      hasPrev: currentPage > 1
    },
    skip
  };
};

export function getPaginationParams(query: { page?: string | string[]; limit?: string | string[] }): { page: number, limit: number, skip: number } {
  const pageStr = (Array.isArray(query.page) ? query.page[0] : query.page) || '1';
  const limitStr = (Array.isArray(query.limit) ? query.limit[0] : query.limit) || '20';
  const rawPage = parseInt(pageStr, 10);
  const rawLimit = parseInt(limitStr, 10);

  const page = Number.isNaN(rawPage) || rawPage < 1 ? 1 : rawPage;
  const limit = Number.isNaN(rawLimit) || rawLimit < 1 ? 20 : Math.min(rawLimit, 100);
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}


export const isValidObjectId = (id: string): boolean => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const { method, originalUrl, ip } = req;
    
    console.log(
      `${method} ${originalUrl} ${res.statusCode} ${duration}ms - ${ip}`
    );
  });
  
  next();
};