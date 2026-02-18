import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { Server } from 'socket.io';
import { createServer } from 'http';

import authRoutes from './routes/auth';
import productRoutes from './routes/product';
import groupRoutes from './routes/group';
import shoppingListRoutes from './routes/shoppingList';
import itemRoutes from './routes/item';
import messageRoutes from './routes/message';
import subCategoryRoutes from './routes/subCategory';
import kashrutRoutes from './routes/kashrut';
import allergenRoutes from './routes/allergen';
import categoryRoutes from './routes/category';
import shoppingRoutes from './routes/shopping';
import settingsRoutes from './routes/settings';
import dashboardRoutes from './routes/dashboard';

import { errorHandler } from './middleware/handlers';
import { notFound } from './middleware/notFound';
import { authenticateToken } from './middleware/auth';
import { attachCsrfCookie, csrfProtection } from './middleware/csrf';

import { initializeSocket } from './socket/socketHandler';
import { logger } from './utils/logger';

const app = express();
app.set('trust proxy', 1);

const server = createServer(app);
dotenv.config();

const allowedOrigins = (process.env.CLIENT_URLS ?? process.env.CLIENT_URL ?? '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

const corsOptions: cors.CorsOptions = {
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);

    if (allowedOrigins.includes(origin)) return cb(null, true);

    return cb(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'x-refresh-token', 'x-session-id', 'x-csrf-token'],
};


app.use(cors(corsOptions));

const io = new Server(server, { cors: corsOptions });

io.engine.on("connection_error", (err) => {
  logger.warn('Socket.IO connection error', { code: err.code, message: err.message });
});



const limiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 500,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// app.use(cors({
//   origin: [ process.env.CLIENT_URL as string],
//   credentials: true,
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
//   allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'x-client', 'x-refresh-token', 'x-session-id'],
// }));

app.use(limiter);
app.use(morgan('combined', {
  skip: (req) => req.url === '/health',
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use('/api', attachCsrfCookie);
app.use('/api', csrfProtection);


app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/groups', authenticateToken, groupRoutes);
app.use('/api/shopping-lists', authenticateToken, shoppingListRoutes);
app.use('/api/items', authenticateToken, itemRoutes);
app.use('/api/messages', authenticateToken, messageRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/sub-categories', subCategoryRoutes);
app.use('/api/kashrut', kashrutRoutes);
app.use('/api/allergen', allergenRoutes);
app.use('/api/shopping', shoppingRoutes);
app.use('/api/settings', authenticateToken, settingsRoutes);
app.use('/api/dashboard', authenticateToken, dashboardRoutes);

app.get('/api', (req, res) => {
  res.json({
    message: 'Smart Group Shopping API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      groups: '/api/groups',
      shoppingLists: '/api/shopping-lists',
      items: '/api/items',
      messages: '/api/messages'
    },
    documentation: '/api/docs'
  });
});

initializeSocket(io);

process.on('uncaughtException', (err: Error) => {
  logger.error('Uncaught exception - shutting down', { name: err.name, message: err.message, stack: err.stack });
  server.close(() => process.exit(1));
});

process.on('unhandledRejection', (err: Error) => {
  logger.error('Unhandled rejection - shutting down', { error: String(err) });
  server.close(() => process.exit(1));
});

app.use(notFound);
app.use(errorHandler);

export { app, server, io };
