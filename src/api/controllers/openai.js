// src/api/controllers/openai.js
const openaiService = require('../../services/openai.js');
const databaseService = require('../../services/database.js');
const logger = require('../../utils/logger.js');
const { ApiError } = require('../../utils/errors.js');

/**
 * Create a new thread for a conversation
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const createThread = async (req, res, next) => {
    try {
        const { conversationId } = req.body;

        if (!conversationId) {
            throw new ApiError(400, 'Missing conversation ID');
        }

        // Find conversation
        const conversation = await databaseService.findConversationById(conversationId);
        if (!conversation) {
            throw new ApiError(404, 'Conversation not found');
        }

        // Create thread
        const thread = await openaiService.createThread();

        // Update conversation config
        await conversation.updateConfig({ thread_id: thread.id });

        res.status(200).json({
            success: true,
            threadId: thread.id
        });
    } catch (error) {
        logger.error('Error creating thread:', error);
        next(error);
    }
};

/**
 * Add a message to a thread
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const addMessageToThread = async (req, res, next) => {
    try {
        const { threadId, content, fileIds } = req.body;

        if (!threadId || !content) {
            throw new ApiError(400, 'Missing required parameters');
        }

        // Add message to thread
        const message = await openaiService.createMessage(
            threadId,
            content,
            fileIds || []
        );

        res.status(200).json({
            success: true,
            messageId: message.id
        });
    } catch (error) {
        logger.error('Error adding message to thread:', error);
        next(error);
    }
};

/**
 * Run the assistant on a thread
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const runAssistant = async (req, res, next) => {
    try {
        const { threadId, conversationId, options } = req.body;

        if (!threadId || !conversationId) {
            throw new ApiError(400, 'Missing required parameters');
        }

        // Find conversation
        const conversation = await databaseService.findConversationById(conversationId);
        if (!conversation) {
            throw new ApiError(404, 'Conversation not found');
        }

        // Run assistant
        const run = await openaiService.runAssistant(threadId, options || {});

        // Update conversation config
        await conversation.updateConfig({ run_id: run.id });

        res.status(200).json({
            success: true,
            runId: run.id
        });
    } catch (error) {
        logger.error('Error running assistant:', error);
        next(error);
    }
};

/**
 * Get the status of a run
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const getRunStatus = async (req, res, next) => {
    try {
        const { threadId, runId } = req.params;

        if (!threadId || !runId) {
            throw new ApiError(400, 'Missing required parameters');
        }

        // Get run status
        const run = await openaiService.getRunStatus(threadId, runId);

        res.status(200).json({
            success: true,
            status: run.status,
            run
        });
    } catch (error) {
        logger.error('Error getting run status:', error);
        next(error);
    }
};

/**
 * Wait for a run to complete
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const waitForRun = async (req, res, next) => {
    try {
        const { threadId, runId } = req.params;
        const { interval, timeout } = req.query;

        if (!threadId || !runId) {
            throw new ApiError(400, 'Missing required parameters');
        }

        // Wait for run to complete
        const run = await openaiService.waitForRun(
            threadId,
            runId,
            interval ? parseInt(interval) : undefined,
            timeout ? parseInt(timeout) : undefined
        );

        res.status(200).json({
            success: true,
            status: run.status,
            run
        });
    } catch (error) {
        logger.error('Error waiting for run:', error);
        next(error);
    }
};

/**
 * Get messages from a thread
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const getMessages = async (req, res, next) => {
    try {
        const { threadId } = req.params;

        if (!threadId) {
            throw new ApiError(400, 'Missing thread ID');
        }

        // Get messages
        const messages = await openaiService.getMessages(threadId);

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
 * Get the last assistant message from a thread
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const getLastAssistantMessage = async (req, res, next) => {
    try {
        const { threadId } = req.params;

        if (!threadId) {
            throw new ApiError(400, 'Missing thread ID');
        }

        // Get last assistant message
        const message = await openaiService.getLastAssistantMessage(threadId);

        if (!message) {
            res.status(404).json({
                success: false,
                message: 'No assistant messages found in thread'
            });
            return;
        }

        res.status(200).json({
            success: true,
            message
        });
    } catch (error) {
        logger.error('Error getting last assistant message:', error);
        next(error);
    }
};

/**
 * Upload a file to OpenAI
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const uploadFile = async (req, res, next) => {
    try {
        if (!req.file) {
            throw new ApiError(400, 'No file uploaded');
        }

        const purpose = req.body.purpose || 'assistants';

        // Upload file
        const file = await openaiService.uploadFile(req.file.buffer, purpose);

        res.status(200).json({
            success: true,
            fileId: file.id,
            file
        });
    } catch (error) {
        logger.error('Error uploading file:', error);
        next(error);
    }
};

module.exports = {
    createThread,
    addMessageToThread,
    runAssistant,
    getRunStatus,
    waitForRun,
    getMessages,
    getLastAssistantMessage,
    uploadFile
};
