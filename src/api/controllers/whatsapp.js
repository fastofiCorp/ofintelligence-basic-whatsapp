const whatsappService = require('../../services/whatsapp.js');
const databaseService = require('../../services/database.js');
const openaiService = require('../../services/openai.js');
const logger = require('../../utils/logger.js');
const { ApiError } = require('../../utils/errors.js');

/**
 * Handle incoming webhook verification
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const verifyWebhook = (req, res) => {
    try {
        // Parse the query params
        const mode = req.query['hub.mode'];
        const token = req.query['hub.verify_token'];
        const challenge = req.query['hub.challenge'];

        // Check if a token and mode were sent
        if (mode && token) {
            // Check the mode and token
            if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
                // Respond with the challenge token from the request
                logger.info('WEBHOOK_VERIFIED');
                res.status(200).send(challenge);
            } else {
                // Respond with '403 Forbidden' if verify tokens do not match
                logger.warn('Verification failed: Token mismatch');
                res.sendStatus(403);
            }
        } else {
            // Missing parameters
            logger.warn('Verification failed: Missing parameters');
            res.sendStatus(400);
        }
    } catch (error) {
        logger.error('Error in webhook verification:', error);
        res.sendStatus(500);
    }
};

/**
 * Handle incoming webhook data
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const handleWebhook = async (req, res, next) => {
    try {
        const data = req.body;

        // Process the incoming webhook data
        const result = await whatsappService.processWebhook(data);

        // Return success response
        res.status(200).json({ success: true });
    } catch (error) {
        logger.error('Error in webhook handler:', error);
        next(error);
    }
};

/**
 * Send a text message to a WhatsApp user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const sendMessage = async (req, res, next) => {
    try {
        const { to, message, conversationId, phoneNumberId } = req.body;

        if (!to || !message || !conversationId || !phoneNumberId) {
            throw new ApiError(400, 'Missing required parameters');
        }

        // Find conversation
        const conversation = await databaseService.findConversationById(conversationId);
        if (!conversation) {
            throw new ApiError(404, 'Conversation not found');
        }

        // Send message
        const result = await whatsappService.sendTextMessage(
            to,
            message,
            phoneNumberId,
            conversationId
        );

        res.status(200).json({
            success: true,
            messageId: result.id
        });
    } catch (error) {
        logger.error('Error sending message:', error);
        next(error);
    }
};

/**
 * Send a media message to a WhatsApp user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const sendMediaMessage = async (req, res, next) => {
    try {
        const { to, mediaData, conversationId, phoneNumberId } = req.body;

        if (!to || !mediaData || !conversationId || !phoneNumberId) {
            throw new ApiError(400, 'Missing required parameters');
        }

        // Find conversation
        const conversation = await databaseService.findConversationById(conversationId);
        if (!conversation) {
            throw new ApiError(404, 'Conversation not found');
        }

        // Send media message
        const result = await whatsappService.sendMediaMessage(
            to,
            mediaData,
            phoneNumberId,
            conversationId
        );

        res.status(200).json({
            success: true,
            messageId: result.id
        });
    } catch (error) {
        logger.error('Error sending media message:', error);
        next(error);
    }
};

/**
 * Mark a message as read
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const markAsRead = async (req, res, next) => {
    try {
        const { messageId, phoneNumberId } = req.body;

        if (!messageId || !phoneNumberId) {
            throw new ApiError(400, 'Missing required parameters');
        }

        // Mark message as read
        await whatsappService.markMessageAsRead(messageId, phoneNumberId);

        res.status(200).json({ success: true });
    } catch (error) {
        logger.error('Error marking message as read:', error);
        next(error);
    }
};

/**
 * Get messages for a conversation
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const getMessages = async (req, res, next) => {
    try {
        const { conversationId } = req.params;
        const { type, status } = req.query;

        if (!conversationId) {
            throw new ApiError(400, 'Missing conversation ID');
        }

        // Find conversation
        const conversation = await databaseService.findConversationById(conversationId);
        if (!conversation) {
            throw new ApiError(404, 'Conversation not found');
        }

        // Get messages
        const messages = await databaseService.findMessagesByConversation(
            conversationId,
            type || null,
            status || null
        );

        res.status(200).json({
            success: true,
            count: messages.length,
            messages
        });
    } catch (error) {
        logger.error('Error getting messages:', error);
        next(error);
    }
};

/**
 * Process a message with OpenAI and send the response via WhatsApp
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const processMessageWithAI = async (req, res, next) => {
    try {
        const { messageId, conversationId, phoneNumberId } = req.body;

        if (!messageId || !conversationId || !phoneNumberId) {
            throw new ApiError(400, 'Missing required parameters');
        }

        // Find conversation and message
        const conversation = await databaseService.findConversationById(conversationId);
        if (!conversation) {
            throw new ApiError(404, 'Conversation not found');
        }

        const message = await databaseService.findMessageById(messageId);
        if (!message) {
            throw new ApiError(404, 'Message not found');
        }

        // Process with OpenAI
        const aiResponse = await openaiService.processConversation(
            message.text,
            conversation
        );

        if (!aiResponse || !aiResponse.content || aiResponse.content.length === 0) {
            throw new ApiError(500, 'No response from AI');
        }

        // Extract text from AI response
        let responseText = '';
        for (const contentPart of aiResponse.content) {
            if (contentPart.type === 'text') {
                responseText += contentPart.text.value;
            }
        }

        // Send response via WhatsApp
        const result = await whatsappService.sendTextMessage(
            conversation.wa_id,
            responseText,
            phoneNumberId,
            conversationId
        );

        res.status(200).json({
            success: true,
            messageId: result.id
        });
    } catch (error) {
        logger.error('Error processing message with AI:', error);
        next(error);
    }
};

module.exports = {
    verifyWebhook,
    handleWebhook,
    sendMessage,
    sendMediaMessage,
    markAsRead,
    getMessages,
    processMessageWithAI
};
