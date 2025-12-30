import { Request, Response, NextFunction } from 'express';
import { 
  IApiResponse, 
  IApiError, 
  ApiResponse,
  IMongooseDuplicateKeyError,
  IMongooseValidationError,
  IMongooseCastError,
  IExtendedError,
  IValidationError,
  IPagination
} from '../types';

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
    fn: (req: Request, res: Response, next: NextFunction) => Promise<void | Response>
  ) =>
    (req: Request, res: Response, next: NextFunction) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };

const handleDuplicateKeyError = (err: IMongooseDuplicateKeyError): AppError => {
    const field = Object.keys(err?.keyValue || {})[0];
    if (field) {
    const value = err.keyValue[field];
    const message = `${field} '${value}' already exists. Please use a different ${field}.`;
    return new AppError(message, 400);
    } else {
    return new AppError('Duplicate field already exists.', 400);
    }
};

const handleValidationError = (err: IMongooseValidationError): AppError => {
  const errors = Object.values(err.errors).map((val) => val.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const handleCastError = (err: IMongooseCastError): AppError => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleJWTError = (): AppError => 
  new AppError('Invalid token. Please log in again.', 401);

const handleJWTExpiredError = (): AppError =>
  new AppError('Your token has expired. Please log in again.', 401);

const sendErrorDev = (err: IExtendedError, res: Response<ApiResponse>): void => {
  const response: IApiResponse<void> = {
    success: false,
    error: err.message,
    message: err.message,
    details: {
      name: err.name,
      statusCode: err.statusCode ?? 500,
      isOperational: err.isOperational ?? false,
    },
    isEmailVerified: err.isEmailVerified ?? false
  };
  if (err.stack) {
    response.stack = err.stack;
  }
  res.status(err.statusCode ?? 500).json(response);
};

const sendErrorProd = (err: IExtendedError, res: Response<ApiResponse>): void => {
  if (err.isOperational) {
    res.status(err.statusCode ?? 500).json({
      success: false,
      message: err.message,
      isEmailVerified: err.isEmailVerified ?? false
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
  err: IExtendedError | IMongooseDuplicateKeyError | IMongooseValidationError | IMongooseCastError | Error,
  req: Request,
  res: Response<ApiResponse>,
  _next: NextFunction
): void => {
  let error: IExtendedError = {
    ...err,
    message: err.message,
    statusCode: (err as IExtendedError).statusCode ?? 500,
    status: (err as IExtendedError).status ?? 'error',
    isOperational: (err as IExtendedError).isOperational ?? false,
    isEmailVerified: (err as IExtendedError).isEmailVerified ?? false,
  };

  console.error(`🚨 Error: ${err.message}`);
  console.error(`📍 URL: ${req.method} ${req.originalUrl}`);
  console.error(`👤 User: ${req.user?.id || 'unauthenticated'}`);
  
  if (process.env.NODE_ENV === 'development') {
    console.error('📚 Stack:', err.stack);
  }

  if ('code' in err && err.code === 11000) {
    error = handleDuplicateKeyError(err as IMongooseDuplicateKeyError);
  }

  if (err.name === 'ValidationError') {
    error = handleValidationError(err as IMongooseValidationError);
  }

  if (err.name === 'CastError') {
    error = handleCastError(err as IMongooseCastError);
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
    error.isOperational = err.isOperational ?? false;
    error.isEmailVerified = err.isEmailVerified ?? false;
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

export const notFound = (req: Request, res: Response<ApiResponse>): void => {
  const message = `Route ${req.originalUrl} not found`;
  res.status(404).json({
    success: false,
    message
  });
};

export const validationErrorResponse = (errors: IValidationError[]): IApiResponse<void> => {
  const errorMessages = errors.reduce((acc, error) => {
    const key = error.path || error.param;
    if (key) {
      acc[key] = error.msg;
    }
    return acc;
  }, {} as Record<string, string>);

  return {
    success: false,
    message: 'Validation errors occurred',
    errors: errorMessages
  };
};

export const successResponse = <T>(
  data?: T,
  message?: string,
  pagination?: IPagination
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