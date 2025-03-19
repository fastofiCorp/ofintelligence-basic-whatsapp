// src/middleware/errorHandler.js
const { ApiError, convertToApiError, handleError } = require('../utils/errors.js');
const logger = require('../utils/logger.js');

/**
 * Middleware to catch route not found errors
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const notFoundHandler = (req, res, next) => {
    const error = new ApiError(404, `Route ${req.originalUrl} not found`);
    next(error);
};

/**
 * Middleware to handle errors
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const errorHandler = (err, req, res, next) => {
    let error = err;

    // If the error is not an instance of ApiError, convert it
    if (!(error instanceof ApiError)) {
        error = convertToApiError(error);
    }

    // Log error
    logger.error(`${error.statusCode} - ${error.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);

    // Handle error globally if it's not operational
    if (!error.isOperational) {
        handleError(error);
    }

    // Send error response
    res.status(error.statusCode).json({
        success: false,
        status: error.statusCode,
        message: error.message,
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
};

module.exports = {
    notFoundHandler,
    errorHandler
};
