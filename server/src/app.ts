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

import { initializeSocket } from './socket/socketHandler';

const app = express();
const server = createServer(app);
dotenv.config();

const clientOrigin = process.env.CLIENT_ORIGIN || process.env.CLIENT_URL;
if (!clientOrigin) {
  console.warn('⚠️  CLIENT_ORIGIN/CLIENT_URL not set. CORS may not work correctly.');
}

const corsOptions = {
  origin: clientOrigin ? (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (!origin) return callback(null, true);
    
    if (origin === clientOrigin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  } : false,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'x-client', 'x-refresh-token', 'x-session-id'],
  exposedHeaders: ['Set-Cookie'],
};

const io = new Server(server, {
  cors: {
    origin: clientOrigin || false,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'x-client', 'x-refresh-token', 'x-session-id'],
  }
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

app.use(cors(corsOptions));

app.use(limiter);
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.set("trust proxy", 1);


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
  console.error('🚨 UNCAUGHT EXCEPTION! Shutting down...');
  console.error('Error:', err.name, err.message);
  console.error('Stack:', err.stack);
  
  server.close(() => {
    console.log('💥 Process terminated!');
    process.exit(1);
  });
});

process.on('unhandledRejection', (err: Error) => {
  console.error('🚨 UNHANDLED REJECTION! Shutting down...');
  console.error('Error:', err);
  
  server.close(() => {
    console.log('💥 Process terminated!');
    process.exit(1);
  });
});

app.use(notFound);
app.use(errorHandler);

export { app, server, io };
