const winston = require('winston');
const dotenv = require('dotenv');

dotenv.config();

// Define log levels
const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
};

// Define log level based on environment
const level = () => {
    const env = process.env.NODE_ENV || 'development';
    const isDevelopment = env === 'development';
    return isDevelopment ? 'debug' : 'warn';
};

// Define colors for each level
const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'blue',
};

// Add colors to winston format
winston.addColors(colors);

// Define format for console logs
const consoleFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
    winston.format.colorize({ all: true }),
    winston.format.printf(
        (info) => `${info.timestamp} ${info.level}: ${info.message}`,
    ),
);

// Define format for file logs
const fileFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
    winston.format.uncolorize(),
    winston.format.json()
);

// Define transports
const transportsArray = [
    // Console transport for all logs
    new winston.transports.Console({
        format: consoleFormat,
    }),

    // File transport for error logs
    new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error',
        format: fileFormat,
    }),

    // File transport for all logs
    new winston.transports.File({
        filename: 'logs/combined.log',
        format: fileFormat,
    }),
];

// Create the logger
const logger = winston.createLogger({
    level: level(),
    levels,
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.splat(),
        winston.format.json()
    ),
    transports: transportsArray,
    exitOnError: false, // Don't exit on handled exceptions
});

// Create a stream object for Morgan HTTP logger
logger.stream = {
    write: (message) => {
        logger.http(message.trim());
    },
};

module.exports = logger;
