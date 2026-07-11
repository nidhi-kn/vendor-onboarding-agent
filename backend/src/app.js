/**
 * app.js
 * 
 * Express application configuration.
 * Configures middleware, routes, and error handling.
 */

const express = require('express');
const cors = require('cors');

// Middleware
const requestLogger = require('./middleware/requestLogger');
const errorHandler = require('./middleware/errorHandler');
const notFound = require('./middleware/notFound');

// Routes
const workflowRoutes = require('./routes/workflow.routes');
const connectorRoutes = require('./routes/connector.routes');
const vendorRoutes = require('./routes/vendor.routes');
const approvalRoutes = require('./routes/approval.routes');
const timelineRoutes = require('./routes/timeline.routes');

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'vendor-onboarding-agent'
    }
  });
});

// API Routes
app.use('/api/workflow', workflowRoutes);
app.use('/api/connector', connectorRoutes);
app.use('/api/vendor', vendorRoutes);
app.use('/api/approval', approvalRoutes);
app.use('/api/timeline', timelineRoutes);

// 404 Handler
app.use(notFound);

// Error Handler (must be last)
app.use(errorHandler);

module.exports = app;
