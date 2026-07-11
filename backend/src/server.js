/**
 * server.js
 * 
 * Server entry point.
 * Starts Express server with graceful shutdown.
 */

require('dotenv').config();
const app = require('./app');
const { getPrismaClient, disconnectPrisma } = require('./config/db');
const workflowRuntime = require('./runtime/workflowRuntime');

const PORT = process.env.PORT || 3000;

// Initialize database connection
const prisma = getPrismaClient();

// Initialize workflow runtime
workflowRuntime.initialize();

// Start server
const server = app.listen(PORT, () => {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    level: 'info',
    service: 'Server',
    message: `Server started on port ${PORT}`,
    port: PORT,
    env: process.env.NODE_ENV || 'development'
  }));
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    level: 'info',
    service: 'Server',
    message: 'SIGTERM received, shutting down gracefully'
  }));

  server.close(async () => {
    await disconnectPrisma();
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'info',
      service: 'Server',
      message: 'Server closed'
    }));
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    level: 'info',
    service: 'Server',
    message: 'SIGINT received, shutting down gracefully'
  }));

  server.close(async () => {
    await disconnectPrisma();
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'info',
      service: 'Server',
      message: 'Server closed'
    }));
    process.exit(0);
  });
});
