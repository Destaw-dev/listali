import { Request, Response, NextFunction } from 'express';
import { IApiResponse, IApiError } from '../types';

// Custom error class
export class AppError extends Error {
  statusCode: number;
  status: string;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Async error wrapper
export const asyncHandler = (
    fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
  ) =>
    (req: Request, res: Response, next: NextFunction) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };

// MongoDB duplicate key error
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

// MongoDB validation error
const handleValidationError = (err: any): AppError => {
  const errors = Object.values(err.errors).map((val: any) => val.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

// MongoDB cast error (invalid ObjectId)
const handleCastError = (err: any): AppError => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

// JWT error handling
const handleJWTError = (): AppError => 
  new AppError('Invalid token. Please log in again.', 401);

const handleJWTExpiredError = (): AppError =>
  new AppError('Your token has expired. Please log in again.', 401);

// Send error in development
const sendErrorDev = (err: any, res: Response<IApiResponse>): void => {
  res.status(err.statusCode || 500).json({
    success: false,
    error: err.message,
    message: err.message,
    stack: err.stack,
    details: {
      name: err.name,
      statusCode: err.statusCode,
      isOperational: err.isOperational
    }
  });
};

// Send error in production
const sendErrorProd = (err: any, res: Response<IApiResponse>): void => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message
    });
  } else {
    // Programming or other unknown error: don't leak error details
    console.error('ERROR 💥:', err);

    res.status(500).json({
      success: false,
      message: 'Something went wrong on our end. Please try again later.'
    });
  }
};

// Main error handling middleware
export const errorHandler = (
  err: any,
  req: Request,
  res: Response<IApiResponse>,
  next: NextFunction
): void => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  console.error(`🚨 Error: ${err.message}`);
  console.error(`📍 URL: ${req.method} ${req.originalUrl}`);
  console.error(`👤 User: ${req.user?.id || 'unauthenticated'}`);
  
  if (process.env.NODE_ENV === 'development') {
    console.error('📚 Stack:', err.stack);
  }

  // Set default values if missing
  error.statusCode = error.statusCode || 500;
  error.status = error.status || 'error';

  // MongoDB duplicate key error
  if (err.code === 11000) {
    error = handleDuplicateKeyError(err);
  }

  // MongoDB validation error
  if (err.name === 'ValidationError') {
    error = handleValidationError(err);
  }

  // MongoDB cast error
  if (err.name === 'CastError') {
    error = handleCastError(err);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = handleJWTError();
  }

  if (err.name === 'TokenExpiredError') {
    error = handleJWTExpiredError();
  }

  // Handle AppError instances
  if (err instanceof AppError) {
    error.statusCode = err.statusCode;
    error.status = err.status;
    error.message = err.message;
    error.isOperational = err.isOperational;
  }

  // Handle generic Error instances
  if (err instanceof Error && !err.message) {
    error.statusCode = 500;
    error.status = 'error';
    error.message = err.message || 'Internal server error';
    error.isOperational = false;
  }

  // Ensure response hasn't been sent
  if (res.headersSent) {
    console.error('🚨 Response already sent, cannot send error');
    return;
  }

  // Send error response
  try {
    if (process.env.NODE_ENV === 'development') {
      sendErrorDev(error, res);
    } else {
      sendErrorProd(error, res);
    }
  } catch (sendError) {
    console.error('🚨 Failed to send error response:', sendError);
    
    // Fallback error response
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// 404 handler
export const notFound = (req: Request, res: Response<IApiResponse>): void => {
  const message = `Route ${req.originalUrl} not found`;
  res.status(404).json({
    success: false,
    message
  });
};

// Validation error helper
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

// Success response helper
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

// אופציונלי: אם אין לך, תוכל להוסיף את זה:
export const errorResponse = (message: string, statusCode = 400, stack: string = ""): IApiResponse<null> => ({
  success: false,
  message,
  data: null,
  stack,
});

// Error response helper
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

// Pagination helper
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

export function getPaginationParams(query: any) {
  const rawPage = parseInt(query.page);
  const rawLimit = parseInt(query.limit);

  const page = Number.isNaN(rawPage) || rawPage < 1 ? 1 : rawPage;
  const limit = Number.isNaN(rawLimit) || rawLimit < 1 ? 20 : Math.min(rawLimit, 100);
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}


// Validate ObjectId helper
export const isValidObjectId = (id: string): boolean => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

// Request logging middleware
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const { method, originalUrl, ip } = req;
    const { statusCode } = res;
    
    console.log(
      `${method} ${originalUrl} ${statusCode} ${duration}ms - ${ip}`
    );
  });
  
  next();
};