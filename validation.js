const Joi = require('joi');
const { AppError } = require('./errorHandler');

// Validation middleware factory
const validate = (schema, property = 'body') => {
    return (req, res, next) => {
        const { error } = schema.validate(req[property], {
            abortEarly: false,
            allowUnknown: false,
            stripUnknown: true
        });

        if (error) {
            const errorMessage = error.details
                .map(detail => detail.message)
                .join(', ');

            return next(new AppError(errorMessage, 400, 'VALIDATION_ERROR'));
        }

        next();
    };
};

// Common validation schemas
const schemas = {
    // User registration
    register: Joi.object({
        name: Joi.string().min(2).max(100).required(),
        email: Joi.string().email().required(),
        password: Joi.string().min(6).max(128).required(),
        phone: Joi.string().pattern(/^[+]?[0-9\s-()]+$/).optional(),
        location: Joi.object({
            country: Joi.string().max(100).optional(),
            city: Joi.string().max(100).optional(),
            coordinates: Joi.object({
                latitude: Joi.number().min(-90).max(90).optional(),
                longitude: Joi.number().min(-180).max(180).optional()
            }).optional()
        }).optional()
    }),

    // User login
    login: Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().required()
    }),

    // Apiary creation
    createApiary: Joi.object({
        name: Joi.string().min(2).max(100).required(),
        location: Joi.object({
            coordinates: Joi.object({
                latitude: Joi.number().min(-90).max(90).required(),
                longitude: Joi.number().min(-180).max(180).required()
            }).required(),
            address: Joi.string().max(255).optional(),
            description: Joi.string().max(500).optional()
        }).required(),
        type: Joi.string().valid('fixed', 'mobile').default('fixed'),
        description: Joi.string().max(1000).optional()
    }),

    // Hive creation
    createHive: Joi.object({
        name: Joi.string().min(1).max(50).required(),
        position: Joi.object({
            row: Joi.number().integer().min(1).required(),
            column: Joi.number().integer().min(1).required(),
            description: Joi.string().max(255).optional()
        }).required(),
        type: Joi.string().valid('بلدي', 'أمريكي', 'كيني', 'وارية', 'دادان', 'other').required(),
        specifications: Joi.object({
            frame_count: Joi.number().integer().min(1).max(50).required(),
            dimensions: Joi.object({
                length: Joi.number().positive().required(),
                width: Joi.number().positive().required(),
                height: Joi.number().positive().required()
            }).required(),
            floor_count: Joi.number().integer().min(1).max(10).default(1),
            frame_type: Joi.string().valid('wooden', 'plastic').default('wooden')
        }).required(),
        colony: Joi.object({
            age: Joi.number().integer().min(0).max(120).required(),
            queen_age: Joi.number().integer().min(0).max(60).required(),
            source: Joi.string().valid('division', 'purchase', 'swarm').required(),
            strength: Joi.string().valid('weak', 'medium', 'strong').default('medium')
        }).required(),
        frames: Joi.object({
            waxed: Joi.number().integer().min(0).default(0),
            empty: Joi.number().integer().min(0).default(0),
            brood: Joi.number().integer().min(0).default(0),
            honey: Joi.number().integer().min(0).default(0),
            pollen: Joi.number().integer().min(0).default(0)
        }).optional()
    }),

    // Inspection creation
    createInspection: Joi.object({
        weather: Joi.object({
            condition: Joi.string().valid('sunny', 'cloudy', 'rainy', 'windy').required(),
            temperature: Joi.number().min(-20).max(60).required()
        }).required(),
        purpose: Joi.string().valid('routine', 'emergency', 'follow_up').default('routine'),
        findings: Joi.object({
            queen_present: Joi.boolean().required(),
            queen_seen: Joi.boolean().required(),
            egg_pattern: Joi.string().valid('regular', 'irregular', 'spotty', 'none').required(),
            brood_pattern: Joi.string().valid('solid', 'patchy', 'scattered').required(),
            colony_strength: Joi.string().valid('weak', 'medium', 'strong').required(),
            temperament: Joi.string().valid('calm', 'aggressive', 'defensive').required(),
            diseases: Joi.array().items(Joi.string()).default([]),
            pests: Joi.array().items(Joi.string()).default([]),
            food_stores: Joi.string().valid('abundant', 'adequate', 'low', 'critical').required()
        }).required(),
        actions: Joi.object({
            feeding: Joi.boolean().default(false),
            treatment: Joi.boolean().default(false),
            super_added: Joi.boolean().default(false),
            super_removed: Joi.boolean().default(false),
            notes: Joi.string().max(1000).optional()
        }).optional(),
        photos: Joi.array().items(Joi.string()).optional(),
        audio_notes: Joi.string().optional()
    }),

    // Pagination
    pagination: Joi.object({
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(100).default(10),
        sort: Joi.string().optional(),
        order: Joi.string().valid('ASC', 'DESC').default('DESC')
    })
};

module.exports = {
    validate,
    schemas
};