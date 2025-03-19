// src/services/whatsapp.js
const axios = require('axios');
const dotenv = require('dotenv');
const databaseService = require('./database.js');
const logger = require('../utils/logger.js');

dotenv.config();

/**
 * Service for handling WhatsApp Business API interactions
 */
class WhatsAppService {
    constructor() {
        this.apiUrl = process.env.WHATSAPP_API_URL;
        this.apiVersion = process.env.WHATSAPP_API_VERSION || 'v18.0';
        this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    }

    /**
     * Process incoming webhook data
     * @param {Object} webhookData - Webhook data from WhatsApp
     * @returns {Promise<Object>} Response data
     */
    async processWebhook(webhookData) {
        try {
            if (!webhookData || !webhookData.entry) {
                logger.warn('Invalid webhook data received');
                return { success: false, error: 'Invalid webhook data' };
            }

            for (const entry of webhookData.entry) {
                for (const change of entry.changes) {
                    if (change.field === 'messages') {
                        await this.handleMessageEvent(change.value);
                    }
                }
            }

            return { success: true };
        } catch (error) {
            logger.error('Error processing webhook:', error);
            throw error;
        }
    }

    /**
     * Handle message events from webhook
     * @param {Object} messageEvent - Message event data
     * @returns {Promise<void>}
     */
    async handleMessageEvent(messageEvent) {
        try {
            if (!messageEvent || !messageEvent.messages || messageEvent.messages.length === 0) {
                logger.warn('No messages in the event');
                return;
            }

            const message = messageEvent.messages[0];
            const metadata = messageEvent.metadata;
            const waId = message.from;
            const businessPhoneNumberId = metadata ? metadata.phone_number_id : null;

            // Find or create conversation
            let conversation = await databaseService.findConversationByWaId(waId);
            if (!conversation) {
                conversation = await databaseService.createConversation({
                    wa_id: waId,
                    type: 'user_initiated',
                    status: 'new'
                });
            }

            // Process message based on type
            if (message.type === 'text') {
                await this.processTextMessage(conversation, message, businessPhoneNumberId, messageEvent);
            } else if (message.type === 'image' || message.type === 'document' ||
                message.type === 'audio' || message.type === 'video') {
                await this.processMediaMessage(conversation, message, businessPhoneNumberId, messageEvent);
            } else if (message.type === 'location') {
                await this.processLocationMessage(conversation, message, businessPhoneNumberId, messageEvent);
            } else if (message.type === 'contacts') {
                await this.processContactMessage(conversation, message, businessPhoneNumberId, messageEvent);
            } else {
                logger.info(`Unsupported message type: ${message.type}`);
            }

        } catch (error) {
            logger.error('Error handling message event:', error);
            throw error;
        }
    }

    /**
     * Process text message
     * @param {Object} conversation - Conversation object
     * @param {Object} message - Message data
     * @param {string} businessPhoneNumberId - Business phone number ID
     * @param {Object} rawData - Raw webhook data
     * @returns {Promise<Object>} Created message
     */
    async processTextMessage(conversation, message, businessPhoneNumberId, rawData) {
        try {
            return await databaseService.createMessage({
                conversation_id: conversation.id,
                type: 'text',
                wa_id: message.id,
                timestamp: new Date(parseInt(message.timestamp) * 1000).toISOString(),
                replying_to_mesage_id: message.context?.id || null,
                business_phone_number_id: businessPhoneNumberId,
                whatsapp_webhook_data: JSON.stringify(rawData),
                text: message.text.body,
                status: 'received'
            });
        } catch (error) {
            logger.error('Error processing text message:', error);
            throw error;
        }
    }

    /**
     * Process media message
     * @param {Object} conversation - Conversation object
     * @param {Object} message - Message data
     * @param {string} businessPhoneNumberId - Business phone number ID
     * @param {Object} rawData - Raw webhook data
     * @returns {Promise<Object>} Created message
     */
    async processMediaMessage(conversation, message, businessPhoneNumberId, rawData) {
        try {
            // Get media URL and info
            const mediaInfo = await this.getMediaInfo(message[message.type]);
            const mediaData = {
                url: mediaInfo.url,
                mime_type: mediaInfo.mime_type,
                filename: mediaInfo.filename || null,
                // Store additional properties if needed
                sha256: mediaInfo.sha256 || null,
                filesize: mediaInfo.filesize || null
            };

            return await databaseService.createMessage({
                conversation_id: conversation.id,
                type: message.type,
                wa_id: message.id,
                timestamp: new Date(parseInt(message.timestamp) * 1000).toISOString(),
                replying_to_mesage_id: message.context?.id || null,
                business_phone_number_id: businessPhoneNumberId,
                whatsapp_webhook_data: JSON.stringify(rawData),
                media: mediaData,
                status: 'received'
            });
        } catch (error) {
            logger.error('Error processing media message:', error);
            throw error;
        }
    }

    /**
     * Process location message
     * @param {Object} conversation - Conversation object
     * @param {Object} message - Message data
     * @param {string} businessPhoneNumberId - Business phone number ID
     * @param {Object} rawData - Raw webhook data
     * @returns {Promise<Object>} Created message
     */
    async processLocationMessage(conversation, message, businessPhoneNumberId, rawData) {
        try {
            return await databaseService.createMessage({
                conversation_id: conversation.id,
                type: 'location',
                wa_id: message.id,
                timestamp: new Date(parseInt(message.timestamp) * 1000).toISOString(),
                replying_to_mesage_id: message.context?.id || null,
                business_phone_number_id: businessPhoneNumberId,
                whatsapp_webhook_data: JSON.stringify(rawData),
                location: message.location,
                status: 'received'
            });
        } catch (error) {
            logger.error('Error processing location message:', error);
            throw error;
        }
    }

    /**
     * Process contact message
     * @param {Object} conversation - Conversation object
     * @param {Object} message - Message data
     * @param {string} businessPhoneNumberId - Business phone number ID
     * @param {Object} rawData - Raw webhook data
     * @returns {Promise<Object>} Created message
     */
    async processContactMessage(conversation, message, businessPhoneNumberId, rawData) {
        try {
            return await databaseService.createMessage({
                conversation_id: conversation.id,
                type: 'contact',
                wa_id: message.id,
                timestamp: new Date(parseInt(message.timestamp) * 1000).toISOString(),
                replying_to_mesage_id: message.context?.id || null,
                business_phone_number_id: businessPhoneNumberId,
                whatsapp_webhook_data: JSON.stringify(rawData),
                contact: message.contacts,
                status: 'received'
            });
        } catch (error) {
            logger.error('Error processing contact message:', error);
            throw error;
        }
    }

    /**
     * Get media info from WhatsApp API
     * @param {Object} media - Media object from webhook
     * @returns {Promise<Object>} Media info
     */
    async getMediaInfo(media) {
        try {
            if (!media || !media.id) {
                throw new Error('Invalid media data');
            }

            const response = await axios.get(
                `${this.apiUrl}/${this.apiVersion}/${media.id}`,
                {
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`
                    }
                }
            );

            return response.data;
        } catch (error) {
            logger.error('Error getting media info:', error);
            throw error;
        }
    }

    /**
     * Send text message to WhatsApp
     * @param {string} to - Recipient phone number
     * @param {string} text - Message text
     * @param {string} phoneNumberId - Phone number ID to send from
     * @param {string} conversationId - Conversation ID
     * @returns {Promise<Object>} Sent message
     */
    async sendTextMessage(to, text, phoneNumberId, conversationId) {
        try {
            const payload = {
                messaging_product: 'whatsapp',
                recipient_type: 'individual',
                to: to,
                type: 'text',
                text: { body: text }
            };

            const response = await axios.post(
                `${this.apiUrl}/${this.apiVersion}/${phoneNumberId}/messages`,
                payload,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.accessToken}`
                    }
                }
            );

            // Create message record in the database
            const message = await databaseService.createBotMessage({
                conversation_id: conversationId,
                type: 'bot_answer',
                wa_id: response.data.messages[0].id,
                timestamp: new Date().toISOString(),
                text: text,
                status: 'sent'
            });

            return message;
        } catch (error) {
            logger.error('Error sending text message:', error);
            throw error;
        }
    }

    /**
     * Send media message to WhatsApp
     * @param {string} to - Recipient phone number
     * @param {Object} mediaData - Media data object
     * @param {string} phoneNumberId - Phone number ID to send from
     * @param {string} conversationId - Conversation ID
     * @returns {Promise<Object>} Sent message
     */
    async sendMediaMessage(to, mediaData, phoneNumberId, conversationId) {
        try {
            const { type, url, caption } = mediaData;

            const payload = {
                messaging_product: 'whatsapp',
                recipient_type: 'individual',
                to: to,
                type: type,
                [type]: {
                    link: url,
                    caption: caption || ''
                }
            };

            const response = await axios.post(
                `${this.apiUrl}/${this.apiVersion}/${phoneNumberId}/messages`,
                payload,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.accessToken}`
                    }
                }
            );

            // Create message record in the database
            const message = await databaseService.createMediaMessage(
                {
                    conversation_id: conversationId,
                    type: 'bot_answer',
                    wa_id: response.data.messages[0].id,
                    timestamp: new Date().toISOString(),
                    status: 'sent'
                },
                {
                    url: url,
                    mime_type: `${type}/${type === 'document' ? 'pdf' : 'jpeg'}`,
                    caption: caption || ''
                }
            );

            return message;
        } catch (error) {
            logger.error('Error sending media message:', error);
            throw error;
        }
    }

    /**
     * Mark message as read
     * @param {string} messageId - Message ID
     * @param {string} phoneNumberId - Phone number ID
     * @returns {Promise<Object>} Response data
     */
    async markMessageAsRead(messageId, phoneNumberId) {
        try {
            const payload = {
                messaging_product: 'whatsapp',
                status: 'read',
                message_id: messageId
            };

            const response = await axios.post(
                `${this.apiUrl}/${this.apiVersion}/${phoneNumberId}/messages`,
                payload,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.accessToken}`
                    }
                }
            );

            // Update message status in the database
            await databaseService.updateMessageStatus(messageId, 'read');

            return response.data;
        } catch (error) {
            logger.error('Error marking message as read:', error);
            throw error;
        }
    }
}

module.exports = new WhatsAppService();
