const { ApiError } = require('../utils/errors.js');
const logger = require('../utils/logger.js');

/**
 * Middleware to restrict access to internal network only
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const internalNetworkOnly = (req, res, next) => {
    const clientIp = req.ip ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.connection.socket.remoteAddress;

    // Allow localhost and internal network IPs
    // You can customize this logic based on your network setup
    if (
        clientIp === '127.0.0.1' ||
        clientIp === '::1' ||
        clientIp.startsWith('10.') ||
        clientIp.startsWith('172.16.') ||
        clientIp.startsWith('172.17.') ||
        clientIp.startsWith('172.18.') ||
        clientIp.startsWith('172.19.') ||
        clientIp.startsWith('172.20.') ||
        clientIp.startsWith('172.21.') ||
        clientIp.startsWith('172.22.') ||
        clientIp.startsWith('172.23.') ||
        clientIp.startsWith('172.24.') ||
        clientIp.startsWith('172.25.') ||
        clientIp.startsWith('172.26.') ||
        clientIp.startsWith('172.27.') ||
        clientIp.startsWith('172.28.') ||
        clientIp.startsWith('172.29.') ||
        clientIp.startsWith('172.30.') ||
        clientIp.startsWith('172.31.') ||
        clientIp.startsWith('192.168.')
    ) {
        return next();
    }

    logger.warn(`Unauthorized access attempt to internal API from IP: ${clientIp}`);
    return next(new ApiError(403, 'Access denied: Internal API'));
};

/**
 * Simple API key authentication middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const apiKeyAuth = (req, res, next) => {
    const apiKey = req.headers['x-api-key'];

    if (!apiKey || apiKey !== process.env.INTERNAL_API_KEY) {
        logger.warn('Invalid API key used');
        return next(new ApiError(401, 'Invalid API key'));
    }

    return next();
};

module.exports = {
    internalNetworkOnly,
    apiKeyAuth
};
