// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const { initDatabase } = require('./src/config/database.js');
const whatsappRoutes = require('./src/api/routes/whatsapp.js');
const openaiRoutes = require('./src/api/routes/openai.js');
const { internalNetworkOnly, apiKeyAuth } = require('./src/middleware/internalAccess.js');
const { notFoundHandler, errorHandler } = require('./src/middleware/errorHandler.js');


// Create Express app
const app = express();

// Set security HTTP headers
app.use(helmet());

// Parse JSON request body
app.use(express.json({ limit: '10mb' }));

// Parse URL-encoded request body
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compress HTTP responses
app.use(compression());

// Enable CORS
app.use(cors());

// HTTP request logger
app.use(morgan('combined'));

// PUBLIC API ROUTES
app.use('/api/whatsapp', whatsappRoutes.publicRouter);

// PRIVATE API ROUTES
// For development, we'll use the private routes without additional security
// In production, you should uncomment the security middleware
const internalMiddleware = [
    // internalNetworkOnly,
    // apiKeyAuth
];

// Mount internal routes
app.use('/internal/whatsapp', internalMiddleware, whatsappRoutes.privateRouter);
app.use('/internal/openai', internalMiddleware, openaiRoutes.privateRouter);

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        uptime: process.uptime(),
        timestamp: Date.now()
    });
});

// Simple test route
app.get('/test', (req, res) => {
    res.status(200).json({
        message: 'Server is running!',
        env: {
            NODE_ENV: process.env.NODE_ENV || 'development'
        }
    });
});

// Handle 404 errors
app.use(notFoundHandler);

// Handle errors
app.use(errorHandler);

// Initialize database connection and start server
const PORT = process.env.PORT || 3000;

// Start server without database initialization for testing
if (process.env.SKIP_DB_INIT === 'true') {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT} (Database initialization skipped)`);
    });
} else {
    // Normal startup with database initialization
    initDatabase()
        .then(() => {
            app.listen(PORT, () => {
                console.log(`Server is running on port ${PORT}`);
            });

            // Handle unhandled promise rejections
            process.on('unhandledRejection', (err) => {
                console.error('UNHANDLED REJECTION:', err);
                process.exit(1);
            });

            // Handle uncaught exceptions
            process.on('uncaughtException', (err) => {
                console.error('UNCAUGHT EXCEPTION:', err);
                process.exit(1);
            });

            // Handle SIGTERM
            process.on('SIGTERM', () => {
                console.info('SIGTERM received, shutting down gracefully');
                console.info('Process terminated');
            });
        })
        .catch((error) => {
            console.error('Failed to initialize database:', error);
            process.exit(1);
        });
}

module.exports = app; // Export for testing
