// src/models/Conversation.js
const { v4: uuidv4 } = require('uuid');
const { getConnection } = require('../config/database.js');
const Message = require('./Message.js');

class Conversation {
    constructor(data = {}) {
        this.id = data.id || uuidv4();
        this.wa_id = data.wa_id;
        this.user_id = data.user_id || null;
        this.patient_id = data.patient_id || null;
        this.type = data.type || 'user_initiated';
        this.status = data.status || 'new';
        this.config = data.config || {};
        this.created_at = data.created_at || new Date();
        this.updated_at = data.updated_at || new Date();
    }

    /**
     * Create a new conversation
     * @returns {Promise<Conversation>} The created conversation
     */
    async create() {
        const connection = await getConnection();
        try {
            const [result] = await connection.execute(
                `INSERT INTO conversations
        (id, wa_id, user_id, patient_id, type, status, created_at, updated_at, config)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    this.id,
                    this.wa_id,
                    this.user_id,
                    this.patient_id,
                    this.type,
                    this.status,
                    this.created_at,
                    this.updated_at,
                    JSON.stringify(this.config)
                ]
            );
            return this;
        } catch (error) {
            throw new Error(`Failed to create conversation: ${error.message}`);
        } finally {
            connection.release();
        }
    }

    /**
     * Find a conversation by its ID
     * @param {string} id - The conversation ID
     * @returns {Promise<Conversation|null>} The found conversation or null
     */
    static async findById(id) {
        const connection = await getConnection();
        try {
            const [rows] = await connection.execute(
                'SELECT * FROM conversations WHERE id = ?',
                [id]
            );
            if (rows.length === 0) return null;

            const conversation = rows[0];
            // Parse JSON config
            conversation.config = conversation.config ? JSON.parse(conversation.config) : {};

            return new Conversation(conversation);
        } catch (error) {
            throw new Error(`Failed to find conversation: ${error.message}`);
        } finally {
            connection.release();
        }
    }

    /**
     * Find a conversation by WhatsApp ID
     * @param {string} waId - The WhatsApp ID
     * @returns {Promise<Conversation|null>} The found conversation or null
     */
    static async findByWaId(waId) {
        const connection = await getConnection();
        try {
            const [rows] = await connection.execute(
                'SELECT * FROM conversations WHERE wa_id = ? ORDER BY created_at DESC LIMIT 1',
                [waId]
            );
            if (rows.length === 0) return null;

            const conversation = rows[0];
            // Parse JSON config
            conversation.config = conversation.config ? JSON.parse(conversation.config) : {};

            return new Conversation(conversation);
        } catch (error) {
            throw new Error(`Failed to find conversation by wa_id: ${error.message}`);
        } finally {
            connection.release();
        }
    }

    /**
     * Update conversation status
     * @param {string} status - The new status
     * @returns {Promise<Conversation>} The updated conversation
     */
    async updateStatus(status) {
        const connection = await getConnection();
        try {
            this.status = status;
            this.updated_at = new Date();

            await connection.execute(
                'UPDATE conversations SET status = ?, updated_at = ? WHERE id = ?',
                [this.status, this.updated_at, this.id]
            );

            return this;
        } catch (error) {
            throw new Error(`Failed to update conversation status: ${error.message}`);
        } finally {
            connection.release();
        }
    }

    /**
     * Update conversation config
     * @param {Object} configData - The config data to update
     * @returns {Promise<Conversation>} The updated conversation
     */
    async updateConfig(configData) {
        const connection = await getConnection();
        try {
            // Merge existing config with new config data
            this.config = { ...this.config, ...configData };
            this.updated_at = new Date();

            await connection.execute(
                'UPDATE conversations SET config = ?, updated_at = ? WHERE id = ?',
                [JSON.stringify(this.config), this.updated_at, this.id]
            );

            return this;
        } catch (error) {
            throw new Error(`Failed to update conversation config: ${error.message}`);
        } finally {
            connection.release();
        }
    }

    /**
     * Get all messages for this conversation
     * @returns {Promise<Array>} Array of Message objects
     */
    async getMessages() {
        return Message.findByConversationId(this.id);
    }
}

module.exports = Conversation;
