// src/utils/errors.js
const logger = require('./logger.js');

/**
 * Custom error class for API errors
 */
class ApiError extends Error {
    constructor(statusCode, message, isOperational = true, stack = '') {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;

        if (stack) {
            this.stack = stack;
        } else {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

/**
 * Custom error class for database errors
 */
class DatabaseError extends Error {
    constructor(message, originalError = null) {
        super(message);
        this.name = 'DatabaseError';
        this.originalError = originalError;
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Custom error class for WhatsApp API errors
 */
class WhatsAppError extends Error {
    constructor(message, code = null, originalError = null) {
        super(message);
        this.name = 'WhatsAppError';
        this.code = code;
        this.originalError = originalError;
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Custom error class for OpenAI API errors
 */
class OpenAIError extends Error {
    constructor(message, code = null, originalError = null) {
        super(message);
        this.name = 'OpenAIError';
        this.code = code;
        this.originalError = originalError;
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Handles errors globally
 * @param {Error} error - The error to handle
 */
const handleError = (error) => {
    logger.error(error);

    // You could add more sophisticated error handling here,
    // such as sending notifications for critical errors or
    // performing recovery actions
};

/**
 * Converts error to API error
 * @param {Error} error - The error to convert
 * @returns {ApiError} The converted error
 */
const convertToApiError = (error) => {
    if (error instanceof ApiError) {
        return error;
    }

    if (error instanceof DatabaseError) {
        return new ApiError(500, 'Database error occurred', true, error.stack);
    }

    if (error instanceof WhatsAppError) {
        return new ApiError(503, `WhatsApp API error: ${error.message}`, true, error.stack);
    }

    if (error instanceof OpenAIError) {
        return new ApiError(503, `OpenAI API error: ${error.message}`, true, error.stack);
    }

    // For other types of errors
    const isOperational = error instanceof Error;
    return new ApiError(
        500,
        isOperational ? error.message : 'Internal server error',
        isOperational,
        error.stack
    );
};

module.exports = {
    ApiError,
    DatabaseError,
    WhatsAppError,
    OpenAIError,
    handleError,
    convertToApiError
};
