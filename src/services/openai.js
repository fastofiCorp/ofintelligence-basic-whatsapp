// src/services/openai.js
const { OpenAI } = require('openai');
const dotenv = require('dotenv');
const logger = require('../utils/logger.js');

dotenv.config();

/**
 * Service for handling OpenAI integrations
 */
class OpenAIService {
    constructor() {
        this.client = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });
        this.assistantId = process.env.OPENAI_ASSISTANT_ID;
    }

    /**
     * Create a new thread
     * @returns {Promise<Object>} Created thread
     */
    async createThread() {
        try {
            const thread = await this.client.beta.threads.create();
            logger.info(`Created new thread: ${thread.id}`);
            return thread;
        } catch (error) {
            logger.error('Error creating thread:', error);
            throw error;
        }
    }

    /**
     * Create a message in a thread
     * @param {string} threadId - Thread ID
     * @param {string} content - Message content
     * @param {Array} fileIds - Optional array of file IDs to attach
     * @returns {Promise<Object>} Created message
     */
    async createMessage(threadId, content, fileIds = []) {
        try {
            const message = await this.client.beta.threads.messages.create(
                threadId,
                {
                    role: 'user',
                    content: content,
                    file_ids: fileIds
                }
            );
            logger.info(`Created message in thread ${threadId}`);
            return message;
        } catch (error) {
            logger.error(`Error creating message in thread ${threadId}:`, error);
            throw error;
        }
    }

    /**
     * Run the assistant on a thread
     * @param {string} threadId - Thread ID
     * @param {Object} options - Additional options for the run
     * @returns {Promise<Object>} Created run
     */
    async runAssistant(threadId, options = {}) {
        try {
            const run = await this.client.beta.threads.runs.create(
                threadId,
                {
                    assistant_id: options.assistantId || this.assistantId,
                    instructions: options.instructions || undefined,
                    model: options.model || undefined
                }
            );
            logger.info(`Started run ${run.id} in thread ${threadId}`);
            return run;
        } catch (error) {
            logger.error(`Error running assistant on thread ${threadId}:`, error);
            throw error;
        }
    }

    /**
     * Get the status of a run
     * @param {string} threadId - Thread ID
     * @param {string} runId - Run ID
     * @returns {Promise<Object>} Run status
     */
    async getRunStatus(threadId, runId) {
        try {
            const run = await this.client.beta.threads.runs.retrieve(
                threadId,
                runId
            );
            logger.info(`Run ${runId} status: ${run.status}`);
            return run;
        } catch (error) {
            logger.error(`Error getting run ${runId} status:`, error);
            throw error;
        }
    }

    /**
     * Wait for a run to complete
     * @param {string} threadId - Thread ID
     * @param {string} runId - Run ID
     * @param {number} interval - Check interval in milliseconds
     * @param {number} timeout - Maximum wait time in milliseconds
     * @returns {Promise<Object>} Completed run
     */
    async waitForRun(threadId, runId, interval = 1000, timeout = 120000) {
        try {
            const startTime = Date.now();
            let run = await this.getRunStatus(threadId, runId);

            while (['queued', 'in_progress', 'cancelling'].includes(run.status)) {
                if (Date.now() - startTime > timeout) {
                    throw new Error(`Run ${runId} timeout after ${timeout}ms`);
                }

                // Wait for the specified interval
                await new Promise(resolve => setTimeout(resolve, interval));

                // Check status again
                run = await this.getRunStatus(threadId, runId);
            }

            logger.info(`Run ${runId} completed with status: ${run.status}`);
            return run;
        } catch (error) {
            logger.error(`Error waiting for run ${runId}:`, error);
            throw error;
        }
    }

    /**
     * Get all messages from a thread
     * @param {string} threadId - Thread ID
     * @returns {Promise<Array>} Array of messages
     */
    async getMessages(threadId) {
        try {
            const messages = await this.client.beta.threads.messages.list(threadId);
            logger.info(`Retrieved ${messages.data.length} messages from thread ${threadId}`);
            return messages.data;
        } catch (error) {
            logger.error(`Error getting messages from thread ${threadId}:`, error);
            throw error;
        }
    }

    /**
     * Get the last assistant message from a thread
     * @param {string} threadId - Thread ID
     * @returns {Promise<Object|null>} The last assistant message or null
     */
    async getLastAssistantMessage(threadId) {
        try {
            const messages = await this.getMessages(threadId);

            // Filter assistant messages and sort by created_at (newest first)
            const assistantMessages = messages
                .filter(msg => msg.role === 'assistant')
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

            return assistantMessages.length > 0 ? assistantMessages[0] : null;
        } catch (error) {
            logger.error(`Error getting last assistant message from thread ${threadId}:`, error);
            throw error;
        }
    }

    /**
     * Upload a file to OpenAI
     * @param {Buffer|string} file - File buffer or path
     * @param {string} purpose - File purpose
     * @returns {Promise<Object>} Uploaded file
     */
    async uploadFile(file, purpose = 'assistants') {
        try {
            const uploadedFile = await this.client.files.create({
                file: file,
                purpose: purpose
            });
            logger.info(`Uploaded file with ID: ${uploadedFile.id}`);
            return uploadedFile;
        } catch (error) {
            logger.error('Error uploading file:', error);
            throw error;
        }
    }

    /**
     * Process a conversation with OpenAI assistant
     * @param {string} message - User message
     * @param {Object} conversation - Conversation object with config
     * @returns {Promise<Object>} Response from assistant
     */
    async processConversation(message, conversation) {
        try {
            const config = conversation.config || {};
            let threadId = config.thread_id;

            // Create thread if it doesn't exist
            if (!threadId) {
                const thread = await this.createThread();
                threadId = thread.id;

                // Update conversation config with thread ID
                config.thread_id = threadId;
                await conversation.updateConfig({ thread_id: threadId });
            }

            // Add message to thread
            await this.createMessage(threadId, message);

            // Run assistant
            const run = await this.runAssistant(threadId, {
                assistantId: config.assistant_openai_id || this.assistantId
            });

            // Update conversation config with run ID
            await conversation.updateConfig({ run_id: run.id });

            // Wait for run to complete
            await this.waitForRun(threadId, run.id);

            // Get the last assistant message
            const response = await this.getLastAssistantMessage(threadId);

            return response;
        } catch (error) {
            logger.error('Error processing conversation with OpenAI:', error);
            throw error;
        }
    }
}

module.exports = new OpenAIService();
