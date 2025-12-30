import { server } from './app';
import { connectDB } from './config/database';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

async function startServer() {
  try {
    console.log('🍃 Connecting to MongoDB...');
    await connectDB();
    console.log('✅ MongoDB Connected successfully');

    server.listen(PORT, () => {
      console.log('🚀 Server running on port', PORT);
      console.log('📊 Environment:', NODE_ENV);
      console.log('🔗 Client URL:', process.env.CLIENT_URL || 'http://localhost:3000' || 'http://localhost:3001');
      console.log('📡 Socket.IO ready for connections');
    });

    server.on('error', (error: Error & { code?: string }) => {
      console.error('🚨 Server error:', error);
      
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use`);
        console.error('💡 Please try a different port or stop the process using this port');
      } else {
        console.error('💥 Unexpected server error, shutting down...');
        process.exit(1);
      }
    });

  } catch (error) {
    console.error('🚨 Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

process.on('SIGTERM', () => {
  console.log('🔄 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🔄 SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Process terminated');
    process.exit(0);
  });
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 Unhandled Rejection at:', promise, 'reason:', reason);
});