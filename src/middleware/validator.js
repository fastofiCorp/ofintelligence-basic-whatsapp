// src/middleware/validator.js
import Joi from 'joi';
import { ApiError } from '../utils/errors.js';

/**
 * Validate request against a Joi schema
 * @param {Object} schema - Joi schema for validation
 * @returns {Function} Middleware function
 */
export const validate = (schema) => (req, res, next) => {
    const validSchema = pick(schema, ['params', 'query', 'body']);
    const object = pick(req, Object.keys(validSchema));
    const { value, error } = Joi.compile(validSchema)
        .prefs({ errors: { label: 'key' } })
        .validate(object);

    if (error) {
        const errorMessage = error.details
            .map((detail) => detail.message)
            .join(', ');

        return next(new ApiError(400, errorMessage));
    }

    // Replace request data with validated data
    Object.assign(req, value);
    return next();
};

/**
 * Pick specified properties from an object
 * @param {Object} object - The source object
 * @param {Array} keys - Array of keys to pick
 * @returns {Object} Object with picked properties
 */
const pick = (object, keys) => {
    return keys.reduce((result, key) => {
        if (object && Object.prototype.hasOwnProperty.call(object, key)) {
            result[key] = object[key];
        }
        return result;
    }, {});
};

// Common validation schemas
export const schemas = {
    // Conversation schemas
    conversation: {
        params: {
            conversationId: Joi.string().uuid().required()
        },
        body: {
            conversationId: Joi.string().uuid().required(),
            status: Joi.string().valid('new', 'active', 'pending', 'closed', 'taken'),
            config: Joi.object()
        }
    },

    // Message schemas
    message: {
        params: {
            messageId: Joi.string().uuid().required()
        },
        body: {
            messageId: Joi.string().required(),
            conversationId: Joi.string().uuid().required(),
            text: Joi.string().allow(''),
            status: Joi.string().valid('pending', 'sent', 'delivered', 'read', 'failed')
        }
    },

    // WhatsApp schemas
    whatsapp: {
        send: {
            body: {
                to: Joi.string().required(),
                message: Joi.string().required(),
                conversationId: Joi.string().uuid().required(),
                phoneNumberId: Joi.string().required()
            }
        },
        sendMedia: {
            body: {
                to: Joi.string().required(),
                mediaData: Joi.object({
                    type: Joi.string().valid('image', 'document', 'audio', 'video').required(),
                    url: Joi.string().uri().required(),
                    caption: Joi.string().allow('')
                }).required(),
                conversationId: Joi.string().uuid().required(),
                phoneNumberId: Joi.string().required()
            }
        },
        markAsRead: {
            body: {
                messageId: Joi.string().required(),
                phoneNumberId: Joi.string().required()
            }
        }
    },

    // OpenAI schemas
    openai: {
        thread: {
            body: {
                conversationId: Joi.string().uuid().required()
            }
        },
        message: {
            body: {
                threadId: Joi.string().required(),
                content: Joi.string().required(),
                fileIds: Joi.array().items(Joi.string())
            }
        },
        run: {
            body: {
                threadId: Joi.string().required(),
                conversationId: Joi.string().uuid().required(),
                options: Joi.object({
                    assistantId: Joi.string(),
                    instructions: Joi.string(),
                    model: Joi.string()
                })
            }
        }
    }
};
