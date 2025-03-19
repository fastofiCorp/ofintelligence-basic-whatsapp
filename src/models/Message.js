const { v4: uuidv4 } = require('uuid');
const { getConnection } = require('../config/database.js');

class Message {
    constructor(data = {}) {
        this.id = data.id || uuidv4();
        this.conversation_id = data.conversation_id;
        this.type = data.type || 'text';
        this.wa_id = data.wa_id || '';
        this.timestamp = data.timestamp || new Date().toISOString();
        this.replying_to_mesage_id = data.replying_to_mesage_id || null;
        this.business_phone_number_id = data.business_phone_number_id || null;
        this.whatsapp_webhook_data = data.whatsapp_webhook_data || null;
        this.text = data.text || null;
        this.media = data.media || null;
        this.location = data.location || null;
        this.contact = data.contact || null;
        this.emoji = data.emoji || null;
        this.status = data.status || 'pending';
        this.created_at = data.created_at || new Date();
        this.updated_at = data.updated_at || new Date();
    }

    /**
     * Create a new message
     * @returns {Promise<Message>} The created message
     */
    async create() {
        const connection = await getConnection();
        try {
            const [result] = await connection.execute(
                `INSERT INTO messages
        (id, conversation_id, type, wa_id, timestamp, replying_to_mesage_id,
        business_phone_number_id, whatsapp_webhook_data, text, media, location,
        contact, emoji, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    this.id,
                    this.conversation_id,
                    this.type,
                    this.wa_id,
                    this.timestamp,
                    this.replying_to_mesage_id,
                    this.business_phone_number_id,
                    this.whatsapp_webhook_data ? JSON.stringify(this.whatsapp_webhook_data) : null,
                    this.text,
                    this.media ? JSON.stringify(this.media) : null,
                    this.location ? JSON.stringify(this.location) : null,
                    this.contact ? JSON.stringify(this.contact) : null,
                    this.emoji ? JSON.stringify(this.emoji) : null,
                    this.status,
                    this.created_at,
                    this.updated_at
                ]
            );
            return this;
        } catch (error) {
            throw new Error(`Failed to create message: ${error.message}`);
        } finally {
            connection.release();
        }
    }

    /**
     * Find a message by its ID
     * @param {string} id - The message ID
     * @returns {Promise<Message|null>} The found message or null
     */
    static async findById(id) {
        const connection = await getConnection();
        try {
            const [rows] = await connection.execute(
                'SELECT * FROM messages WHERE id = ?',
                [id]
            );
            if (rows.length === 0) return null;

            const message = rows[0];

            // Parse JSON fields
            message.whatsapp_webhook_data = message.whatsapp_webhook_data ? JSON.parse(message.whatsapp_webhook_data) : null;
            message.media = message.media ? JSON.parse(message.media) : null;
            message.location = message.location ? JSON.parse(message.location) : null;
            message.contact = message.contact ? JSON.parse(message.contact) : null;
            message.emoji = message.emoji ? JSON.parse(message.emoji) : null;

            return new Message(message);
        } catch (error) {
            throw new Error(`Failed to find message: ${error.message}`);
        } finally {
            connection.release();
        }
    }

    /**
     * Find messages by conversation ID
     * @param {string} conversationId - The conversation ID
     * @param {string} type - Optional message type filter
     * @param {string} status - Optional message status filter
     * @returns {Promise<Array>} Array of Message objects
     */
    static async findByConversationId(conversationId, type = null, status = null) {
        const connection = await getConnection();
        try {
            let query = 'SELECT * FROM messages WHERE conversation_id = ?';
            const params = [conversationId];

            if (type) {
                query += ' AND type = ?';
                params.push(type);
            }

            if (status) {
                query += ' AND status = ?';
                params.push(status);
            }

            query += ' ORDER BY created_at ASC';

            const [rows] = await connection.execute(query, params);

            // Parse JSON fields for each message
            return rows.map(message => {
                message.whatsapp_webhook_data = message.whatsapp_webhook_data ? JSON.parse(message.whatsapp_webhook_data) : null;
                message.media = message.media ? JSON.parse(message.media) : null;
                message.location = message.location ? JSON.parse(message.location) : null;
                message.contact = message.contact ? JSON.parse(message.contact) : null;
                message.emoji = message.emoji ? JSON.parse(message.emoji) : null;

                return new Message(message);
            });
        } catch (error) {
            throw new Error(`Failed to find messages by conversation: ${error.message}`);
        } finally {
            connection.release();
        }
    }

    /**
     * Update message status
     * @param {string} status - The new status
     * @returns {Promise<Message>} The updated message
     */
    async updateStatus(status) {
        const connection = await getConnection();
        try {
            this.status = status;
            this.updated_at = new Date();

            await connection.execute(
                'UPDATE messages SET status = ?, updated_at = ? WHERE id = ?',
                [this.status, this.updated_at, this.id]
            );

            return this;
        } catch (error) {
            throw new Error(`Failed to update message status: ${error.message}`);
        } finally {
            connection.release();
        }
    }

    /**
     * Create a text message
     * @param {Object} data - Message data
     * @returns {Promise<Message>} The created message
     */
    static async createTextMessage(data) {
        const message = new Message({
            ...data,
            type: 'text'
        });
        return message.create();
    }

    /**
     * Create a media message
     * @param {Object} data - Message data
     * @param {Object} mediaData - Media data (url, mime_type)
     * @returns {Promise<Message>} The created message
     */
    static async createMediaMessage(data, mediaData) {
        const message = new Message({
            ...data,
            type: 'media',
            media: mediaData
        });
        return message.create();
    }

    /**
     * Create a bot answer message
     * @param {Object} data - Message data
     * @returns {Promise<Message>} The created message
     */
    static async createBotMessage(data) {
        const message = new Message({
            ...data,
            type: 'bot_answer',
            status: 'sent'
        });
        return message.create();
    }
}

module.exports = Message;
