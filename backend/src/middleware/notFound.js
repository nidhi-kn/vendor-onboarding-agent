/**
 * notFound.js
 * 
 * 404 handler for undefined routes.
 */

/**
 * 404 Not Found middleware
 */
function notFound(req, res, next) {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`
    }
  });
}

module.exports = notFound;
