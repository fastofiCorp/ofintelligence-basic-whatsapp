const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const dotenv = require('dotenv');

const whatsappRoutes = require('./api/routes/whatsapp.js');
const openaiRoutes = require('./api/routes/openai.js');
const errorMiddleware = require('./middleware/errorHandler.js');
const logger = require('./utils/logger.js');

dotenv.config();

// Initialize Express app
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
app.use(morgan('combined', { stream: logger.stream }));

// PUBLIC API ROUTES
app.use('/api/whatsapp', whatsappRoutes.publicRouter);

// PRIVATE API ROUTES - for now, without additional security for debugging
app.use('/internal/whatsapp', whatsappRoutes.privateRouter);
app.use('/internal/openai', openaiRoutes.privateRouter);

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        uptime: process.uptime(),
        timestamp: Date.now()
    });
});

// Simple test route to verify app is working
app.get('/test', (req, res) => {
    res.send('App is working!');
});

// Handle 404 errors
app.use(errorMiddleware.notFoundHandler);

// Handle errors
app.use(errorMiddleware.errorHandler);

module.exports = app;
