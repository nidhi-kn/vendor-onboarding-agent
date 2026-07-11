/**
 * requestLogger.js
 * 
 * Logs incoming HTTP requests with timing.
 */

/**
 * Request logger middleware
 */
function requestLogger(req, res, next) {
  const start = Date.now();
  
  // Log request
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    level: 'info',
    service: 'API',
    method: req.method,
    path: req.path,
    query: req.query,
    body: req.method !== 'GET' ? req.body : undefined
  }));

  // Capture response
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'info',
      service: 'API',
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`
    }));
  });

  next();
}

module.exports = requestLogger;
