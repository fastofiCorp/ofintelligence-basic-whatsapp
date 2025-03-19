const express = require('express');
const whatsappController = require('../controllers/whatsapp.js');

// Create separate routers for public and private endpoints
const publicRouter = express.Router();
const privateRouter = express.Router();

// Public endpoints (exposed to internet)
/**
 * @route GET /api/whatsapp/webhook
 * @desc Verify webhook for WhatsApp API
 * @access Public
 */
publicRouter.get('/webhook', whatsappController.verifyWebhook);

/**
 * @route POST /api/whatsapp/webhook
 * @desc Handle incoming webhook data from WhatsApp
 * @access Public
 */
publicRouter.post('/webhook', whatsappController.handleWebhook);

// Private endpoints (internal only)
/**
 * @route POST /internal/whatsapp/send
 * @desc Send a text message to a WhatsApp user
 * @access Private
 */
privateRouter.post('/send', whatsappController.sendMessage);

/**
 * @route POST /internal/whatsapp/sendMedia
 * @desc Send a media message to a WhatsApp user
 * @access Private
 */
privateRouter.post('/sendMedia', whatsappController.sendMediaMessage);

/**
 * @route POST /internal/whatsapp/markAsRead
 * @desc Mark a message as read
 * @access Private
 */
privateRouter.post('/markAsRead', whatsappController.markAsRead);

/**
 * @route GET /internal/whatsapp/messages/:conversationId
 * @desc Get messages for a conversation
 * @access Private
 */
privateRouter.get('/messages/:conversationId', whatsappController.getMessages);

/**
 * @route POST /internal/whatsapp/processWithAI
 * @desc Process a message with OpenAI and send the response via WhatsApp
 * @access Private
 */
privateRouter.post('/processWithAI', whatsappController.processMessageWithAI);

module.exports = { publicRouter, privateRouter };
