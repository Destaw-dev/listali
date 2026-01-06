import { Request, Response, NextFunction } from 'express';
import { IApiResponse } from '../types';

export const notFound = (req: Request, res: Response<IApiResponse<null>>, _next: NextFunction): void => {
  res.status(404);
  
  res.json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
    data: null,
    errors: {
      route: `The requested endpoint ${req.method} ${req.originalUrl} does not exist`
    }
  });
};

export const notFoundDetailed = (req: Request, res: Response<IApiResponse<{ requestedMethod: string; requestedUrl: string; availableRoutes: string[]; suggestion: string } | null>>, _next: NextFunction): void => {
  const availableRoutes = [
    'GET /health',
    'GET /api',
    'POST /api/auth/register',
    'POST /api/auth/login',
    'POST /api/auth/logout',
    'GET /api/auth/me',
    'GET /api/groups',
    'POST /api/groups',
    'GET /api/groups/:id',
    'PUT /api/groups/:id',
    'DELETE /api/groups/:id',
    'GET /api/shopping-lists',
    'POST /api/shopping-lists',
    'GET /api/shopping-lists/:id',
    'PUT /api/shopping-lists/:id',
    'DELETE /api/shopping-lists/:id',
    'GET /api/items',
    'POST /api/items',
    'GET /api/items/:id',
    'PUT /api/items/:id',
    'DELETE /api/items/:id',
    'GET /api/messages',
    'POST /api/messages'
  ];

  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
    data: {
      requestedMethod: req.method,
      requestedUrl: req.originalUrl,
      availableRoutes: availableRoutes,
      suggestion: 'Please check the API documentation for available endpoints'
    },
    errors: {
      route: `The requested endpoint ${req.method} ${req.originalUrl} does not exist`
    }
  });
};

export const apiNotFound = (req: Request, res: Response<IApiResponse<null>>, next: NextFunction): void => {
  if (req.originalUrl.startsWith('/api')) {
    res.status(404).json({
      success: false,
      message: `API endpoint ${req.method} ${req.originalUrl} not found`,
      data: null,
      errors: {
        endpoint: `The API endpoint ${req.method} ${req.originalUrl} does not exist`
      }
    });
  } else {
    next();
  }
};

export const genericNotFound = (req: Request, res: Response, _next: NextFunction): void => {
  res.status(404).send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>404 - Page Not Found</title>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          text-align: center; 
          padding: 50px;
          background-color: #f5f5f5;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background: white;
          padding: 40px;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 { 
          color: #e74c3c; 
          margin-bottom: 20px;
        }
        p { 
          color: #7f8c8d; 
          line-height: 1.6;
        }
        .code {
          background: #ecf0f1;
          padding: 10px;
          border-radius: 4px;
          font-family: monospace;
          margin: 20px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>404 - Page Not Found</h1>
        <p>The page you are looking for doesn't exist.</p>
        <div class="code">${req.method} ${req.originalUrl}</div>
        <p>If you believe this is an error, please contact support.</p>
      </div>
    </body>
    </html>
  `);
};

export default notFound;