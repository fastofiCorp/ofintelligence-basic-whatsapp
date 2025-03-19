// src/services/database.js
const { Conversation, Message } = require('../models/index.js');

/**
 * Service for handling database operations
 */
class DatabaseService {
    /**
     * Create a new conversation
     * @param {Object} data - Conversation data
     * @returns {Promise<Object>} Created conversation
     */
    async createConversation(data) {
        try {
            const conversation = new Conversation(data);
            return await conversation.create();
        } catch (error) {
            console.error('Error creating conversation:', error);
            throw error;
        }
    }

    /**
     * Find a conversation by ID
     * @param {string} id - Conversation ID
     * @returns {Promise<Object|null>} Found conversation or null
     */
    async findConversationById(id) {
        try {
            return await Conversation.findById(id);
        } catch (error) {
            console.error('Error finding conversation:', error);
            throw error;
        }
    }

    /**
     * Find a conversation by WhatsApp ID
     * @param {string} waId - WhatsApp ID
     * @returns {Promise<Object|null>} Found conversation or null
     */
    async findConversationByWaId(waId) {
        try {
            return await Conversation.findByWaId(waId);
        } catch (error) {
            console.error('Error finding conversation by wa_id:', error);
            throw error;
        }
    }

    /**
     * Update conversation status
     * @param {string} id - Conversation ID
     * @param {string} status - New status
     * @returns {Promise<Object>} Updated conversation
     */
    async updateConversationStatus(id, status) {
        try {
            const conversation = await Conversation.findById(id);
            if (!conversation) {
                throw new Error(`Conversation with ID ${id} not found`);
            }
            return await conversation.updateStatus(status);
        } catch (error) {
            console.error('Error updating conversation status:', error);
            throw error;
        }
    }

    /**
     * Update conversation config
     * @param {string} id - Conversation ID
     * @param {Object} configData - Config data to update
     * @returns {Promise<Object>} Updated conversation
     */
    async updateConversationConfig(id, configData) {
        try {
            const conversation = await Conversation.findById(id);
            if (!conversation) {
                throw new Error(`Conversation with ID ${id} not found`);
            }
            return await conversation.updateConfig(configData);
        } catch (error) {
            console.error('Error updating conversation config:', error);
            throw error;
        }
    }

    /**
     * Create a new message
     * @param {Object} data - Message data
     * @returns {Promise<Object>} Created message
     */
    async createMessage(data) {
        try {
            const message = new Message(data);
            return await message.create();
        } catch (error) {
            console.error('Error creating message:', error);
            throw error;
        }
    }

    /**
     * Create a text message
     * @param {Object} data - Message data
     * @returns {Promise<Object>} Created message
     */
    async createTextMessage(data) {
        try {
            return await Message.createTextMessage(data);
        } catch (error) {
            console.error('Error creating text message:', error);
            throw error;
        }
    }

    /**
     * Create a media message
     * @param {Object} data - Message data
     * @param {Object} mediaData - Media data
     * @returns {Promise<Object>} Created message
     */
    async createMediaMessage(data, mediaData) {
        try {
            return await Message.createMediaMessage(data, mediaData);
        } catch (error) {
            console.error('Error creating media message:', error);
            throw error;
        }
    }

    /**
     * Create a bot message
     * @param {Object} data - Message data
     * @returns {Promise<Object>} Created message
     */
    async createBotMessage(data) {
        try {
            return await Message.createBotMessage(data);
        } catch (error) {
            console.error('Error creating bot message:', error);
            throw error;
        }
    }

    /**
     * Find a message by ID
     * @param {string} id - Message ID
     * @returns {Promise<Object|null>} Found message or null
     */
    async findMessageById(id) {
        try {
            return await Message.findById(id);
        } catch (error) {
            console.error('Error finding message:', error);
            throw error;
        }
    }

    /**
     * Find messages by conversation ID
     * @param {string} conversationId - Conversation ID
     * @param {string} type - Optional message type filter
     * @param {string} status - Optional message status filter
     * @returns {Promise<Array>} Array of messages
     */
    async findMessagesByConversation(conversationId, type = null, status = null) {
        try {
            return await Message.findByConversationId(conversationId, type, status);
        } catch (error) {
            console.error('Error finding messages by conversation:', error);
            throw error;
        }
    }

    /**
     * Update message status
     * @param {string} id - Message ID
     * @param {string} status - New status
     * @returns {Promise<Object>} Updated message
     */
    async updateMessageStatus(id, status) {
        try {
            const message = await Message.findById(id);
            if (!message) {
                throw new Error(`Message with ID ${id} not found`);
            }
            return await message.updateStatus(status);
        } catch (error) {
            console.error('Error updating message status:', error);
            throw error;
        }
    }
}

module.exports = new DatabaseService();
