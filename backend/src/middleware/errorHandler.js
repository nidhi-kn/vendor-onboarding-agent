/**
 * errorHandler.js
 * 
 * Centralized error handling middleware.
 * Returns consistent JSON error responses.
 */

/**
 * Error handler middleware
 */
function errorHandler(err, req, res, next) {
  console.error(JSON.stringify({
    timestamp: new Date().toISOString(),
    level: 'error',
    service: 'API',
    method: req.method,
    path: req.path,
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  }));

  // Determine status code
  const statusCode = err.statusCode || 500;
  
  // Determine error code
  let errorCode = err.code || 'INTERNAL_ERROR';
  
  // Handle specific error types
  if (err.name === 'ValidationError') {
    errorCode = 'VALIDATION_ERROR';
  } else if (err.name === 'ZodError') {
    errorCode = 'SCHEMA_VALIDATION_ERROR';
  } else if (err.message.includes('not found')) {
    errorCode = 'NOT_FOUND';
  }

  // Send error response
  res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message: err.message,
      details: process.env.NODE_ENV === 'development' ? err.details : undefined
    }
  });
}

module.exports = errorHandler;
