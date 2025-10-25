const express = require('express');
const router = express.Router();
const { body, param, query, validationResult } = require('express-validator');
const FeedingService = require('../services/FeedingService');
const { Hive, Apiary } = require('../models');
const auth = require('../middleware/auth');

// Get all feeding records for a user
router.get('/', [
    auth,
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('hive_id').optional().isInt(),
    query('apiary_id').optional().isInt(),
    query('feeding_type').optional().isIn([
        'sugar_syrup', 'honey_syrup', 'pollen_patty', 'protein_patty',
        'emergency_feeding', 'winter_feeding', 'stimulative_feeding',
        'maintenance_feeding', 'candy_board', 'fondant', 'custom'
    ]),
    query('status').optional().isIn(['planned', 'completed', 'partially_consumed', 'rejected', 'cancelled']),
    query('date_from').optional().isISO8601(),
    query('date_to').optional().isISO8601()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'بيانات غير صحيحة',
                errors: errors.array()
            });
        }

        const filters = {
            hive_id: req.query.hive_id,
            apiary_id: req.query.apiary_id,
            feeding_type: req.query.feeding_type,
            status: req.query.status,
            date_from: req.query.date_from,
            date_to: req.query.date_to
        };

        const pagination = {
            page: parseInt(req.query.page) || 1,
            limit: parseInt(req.query.limit) || 20,
            sort_by: req.query.sort_by || 'feeding_date',
            sort_order: req.query.sort_order || 'DESC'
        };

        const result = await FeedingService.getFeedings(req.user.id, filters, pagination);

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Error fetching feedings:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في جلب سجلات التغذية'
        });
    }
});

// Get feeding by ID
router.get('/:id', [
    auth,
    param('id').isInt().withMessage('معرف التغذية مطلوب')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'بيانات غير صحيحة',
                errors: errors.array()
            });
        }

        const { Feeding } = require('../models');
        const feeding = await Feeding.findOne({
            where: {
                id: req.params.id,
                user_id: req.user.id
            },
            include: [
                {
                    model: Hive,
                    as: 'hive',
                    attributes: ['id', 'name', 'hive_type'],
                    include: [{
                        model: Apiary,
                        as: 'apiary',
                        attributes: ['id', 'name', 'location']
                    }]
                }
            ]
        });

        if (!feeding) {
            return res.status(404).json({
                success: false,
                message: 'سجل التغذية غير موجود'
            });
        }

        res.json({
            success: true,
            data: feeding
        });
    } catch (error) {
        console.error('Error fetching feeding:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في جلب سجل التغذية'
        });
    }
});

// Create new feeding record
router.post('/', [
    auth,
    body('hive_id').optional().isInt(),
    body('apiary_id').optional().isInt(),
    body('feeding_type').isIn([
        'sugar_syrup', 'honey_syrup', 'pollen_patty', 'protein_patty',
        'emergency_feeding', 'winter_feeding', 'stimulative_feeding',
        'maintenance_feeding', 'candy_board', 'fondant', 'custom'
    ]).withMessage('نوع التغذية غير صحيح'),
    body('feeding_date').optional().isISO8601(),
    body('recipe_name').optional().isString().isLength({ max: 100 }),
    body('ingredients').isObject().withMessage('المكونات مطلوبة'),
    body('total_amount').optional().isDecimal(),
    body('total_cost').isDecimal().withMessage('التكلفة الإجمالية مطلوبة'),
    body('feeding_method').isIn([
        'top_feeder', 'entrance_feeder', 'boardman_feeder', 'frame_feeder',
        'baggie_feeder', 'patty_placement', 'candy_board', 'other'
    ]).withMessage('طريقة التغذية غير صحيحة'),
    body('notes').optional().isString().isLength({ max: 2000 }),
    body('next_feeding_date').optional().isISO8601(),
    body('status').optional().isIn(['planned', 'completed', 'partially_consumed', 'rejected', 'cancelled'])
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'بيانات غير صحيحة',
                errors: errors.array()
            });
        }

        // Verify hive ownership if hive_id provided
        if (req.body.hive_id) {
            const hive = await Hive.findOne({
                where: {
                    id: req.body.hive_id,
                    user_id: req.user.id
                }
            });

            if (!hive) {
                return res.status(404).json({
                    success: false,
                    message: 'الخلية غير موجودة'
                });
            }
        }

        const feedingData = {
            ...req.body,
            user_id: req.user.id
        };

        const feeding = await FeedingService.createFeeding(feedingData);

        res.status(201).json({
            success: true,
            data: feeding
        });
    } catch (error) {
        console.error('Error creating feeding:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في إنشاء سجل التغذية'
        });
    }
});

// Update feeding record
router.put('/:id', [
    auth,
    param('id').isInt().withMessage('معرف التغذية مطلوب'),
    body('feeding_type').optional().isIn([
        'sugar_syrup', 'honey_syrup', 'pollen_patty', 'protein_patty',
        'emergency_feeding', 'winter_feeding', 'stimulative_feeding',
        'maintenance_feeding', 'candy_board', 'fondant', 'custom'
    ]),
    body('ingredients').optional().isObject(),
    body('total_amount').optional().isDecimal(),
    body('amount_consumed').optional().isDecimal(),
    body('total_cost').optional().isDecimal(),
    body('consumption_rate').optional().isIn(['none', 'slow', 'moderate', 'fast', 'very_fast']),
    body('bee_response').optional().isIn(['positive', 'neutral', 'negative', 'aggressive']),
    body('effectiveness').optional().isInt({ min: 1, max: 10 }),
    body('status').optional().isIn(['planned', 'completed', 'partially_consumed', 'rejected', 'cancelled']),
    body('notes').optional().isString().isLength({ max: 2000 })
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'بيانات غير صحيحة',
                errors: errors.array()
            });
        }

        const feeding = await FeedingService.updateFeeding(
            req.params.id,
            req.body,
            req.user.id
        );

        if (!feeding) {
            return res.status(404).json({
                success: false,
                message: 'سجل التغذية غير موجود'
            });
        }

        res.json({
            success: true,
            data: feeding
        });
    } catch (error) {
        console.error('Error updating feeding:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في تحديث سجل التغذية'
        });
    }
});

// Delete feeding record
router.delete('/:id', [
    auth,
    param('id').isInt().withMessage('معرف التغذية مطلوب')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'بيانات غير صحيحة',
                errors: errors.array()
            });
        }

        const success = await FeedingService.deleteFeeding(req.params.id, req.user.id);

        if (!success) {
            return res.status(404).json({
                success: false,
                message: 'سجل التغذية غير موجود'
            });
        }

        res.json({
            success: true,
            message: 'تم حذف سجل التغذية بنجاح'
        });
    } catch (error) {
        console.error('Error deleting feeding:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في حذف سجل التغذية'
        });
    }
});

// Calculate feeding amounts
router.post('/calculate', [
    auth,
    body('hive_data').isObject().withMessage('بيانات الخلية مطلوبة'),
    body('feeding_type').isIn([
        'sugar_syrup', 'honey_syrup', 'pollen_patty', 'protein_patty',
        'emergency_feeding', 'winter_feeding', 'stimulative_feeding',
        'maintenance_feeding', 'candy_board', 'fondant'
    ]).withMessage('نوع التغذية غير صحيح'),
    body('season').optional().isIn(['spring', 'summer', 'autumn', 'winter']),
    body('weather_conditions').optional().isObject()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'بيانات غير صحيحة',
                errors: errors.array()
            });
        }

        const calculation = FeedingService.calculateFeedingAmounts(
            req.body.hive_data,
            req.body.feeding_type,
            req.body.season,
            req.body.weather_conditions
        );

        res.json({
            success: true,
            data: calculation
        });
    } catch (error) {
        console.error('Error calculating feeding amounts:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في حساب كميات التغذية'
        });
    }
});

// Calculate bulk feeding for multiple hives
router.post('/calculate-bulk', [
    auth,
    body('hives_data').isArray().withMessage('بيانات الخلايا مطلوبة'),
    body('hives_data.*.hive_id').isInt(),
    body('hives_data.*.hive_name').isString(),
    body('hives_data.*.population_strength').isIn(['very_weak', 'weak', 'moderate', 'strong', 'very_strong']),
    body('hives_data.*.food_stores').isIn(['none', 'critical', 'low', 'adequate', 'abundant']),
    body('feeding_type').isIn([
        'sugar_syrup', 'honey_syrup', 'pollen_patty', 'protein_patty',
        'emergency_feeding', 'winter_feeding', 'stimulative_feeding',
        'maintenance_feeding'
    ]).withMessage('نوع التغذية غير صحيح'),
    body('season').optional().isIn(['spring', 'summer', 'autumn', 'winter'])
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'بيانات غير صحيحة',
                errors: errors.array()
            });
        }

        const calculation = FeedingService.calculateBulkFeeding(
            req.body.hives_data,
            req.body.feeding_type,
            req.body.season
        );

        res.json({
            success: true,
            data: calculation
        });
    } catch (error) {
        console.error('Error calculating bulk feeding:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في حساب التغذية الجماعية'
        });
    }
});

// Get feeding recipes
router.get('/recipes/list', auth, async (req, res) => {
    try {
        const recipes = FeedingService.getFeedingRecipes();

        res.json({
            success: true,
            data: recipes
        });
    } catch (error) {
        console.error('Error fetching recipes:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في جلب الوصفات'
        });
    }
});

// Get feeding schedule
router.post('/schedule', [
    auth,
    body('hive_data').isObject().withMessage('بيانات الخلية مطلوبة'),
    body('feeding_type').isIn([
        'sugar_syrup', 'honey_syrup', 'pollen_patty', 'protein_patty',
        'emergency_feeding', 'winter_feeding', 'stimulative_feeding',
        'maintenance_feeding'
    ]).withMessage('نوع التغذية غير صحيح'),
    body('duration').optional().isInt({ min: 1, max: 90 })
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'بيانات غير صحيحة',
                errors: errors.array()
            });
        }

        const schedule = FeedingService.getFeedingSchedule(
            req.body.hive_data,
            req.body.feeding_type,
            req.body.duration || 30
        );

        res.json({
            success: true,
            data: schedule
        });
    } catch (error) {
        console.error('Error generating feeding schedule:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في إنشاء جدول التغذية'
        });
    }
});

// Get feeding statistics
router.get('/stats/summary', [
    auth,
    query('hive_id').optional().isInt(),
    query('apiary_id').optional().isInt(),
    query('days').optional().isInt({ min: 1, max: 365 })
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'بيانات غير صحيحة',
                errors: errors.array()
            });
        }

        const filters = {
            hive_id: req.query.hive_id,
            apiary_id: req.query.apiary_id,
            days: parseInt(req.query.days) || 30
        };

        const stats = await FeedingService.getFeedingStats(req.user.id, filters);

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Error fetching feeding stats:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في جلب إحصائيات التغذية'
        });
    }
});

// Get upcoming feedings
router.get('/upcoming/list', [
    auth,
    query('days').optional().isInt({ min: 1, max: 30 })
], async (req, res) => {
    try {
        const { Feeding } = require('../models');
        const days = parseInt(req.query.days) || 7;

        const upcomingFeedings = await Feeding.getUpcomingFeedings(req.user.id, days);

        res.json({
            success: true,
            data: upcomingFeedings
        });
    } catch (error) {
        console.error('Error fetching upcoming feedings:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في جلب التغذيات القادمة'
        });
    }
});

// Get overdue feedings
router.get('/overdue/list', auth, async (req, res) => {
    try {
        const { Feeding } = require('../models');

        const overdueFeedings = await Feeding.getOverdueFeedings(req.user.id);

        res.json({
            success: true,
            data: overdueFeedings
        });
    } catch (error) {
        console.error('Error fetching overdue feedings:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في جلب التغذيات المتأخرة'
        });
    }
});

// Mark feeding as completed
router.patch('/:id/complete', [
    auth,
    param('id').isInt().withMessage('معرف التغذية مطلوب'),
    body('amount_consumed').optional().isDecimal(),
    body('consumption_rate').optional().isIn(['none', 'slow', 'moderate', 'fast', 'very_fast']),
    body('bee_response').optional().isIn(['positive', 'neutral', 'negative', 'aggressive']),
    body('effectiveness').optional().isInt({ min: 1, max: 10 }),
    body('notes').optional().isString().isLength({ max: 1000 })
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'بيانات غير صحيحة',
                errors: errors.array()
            });
        }

        const updateData = {
            ...req.body,
            status: 'completed',
            feeding_date: new Date()
        };

        const feeding = await FeedingService.updateFeeding(
            req.params.id,
            updateData,
            req.user.id
        );

        if (!feeding) {
            return res.status(404).json({
                success: false,
                message: 'سجل التغذية غير موجود'
            });
        }

        res.json({
            success: true,
            data: feeding,
            message: 'تم تحديد التغذية كمكتملة'
        });
    } catch (error) {
        console.error('Error completing feeding:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في تحديث حالة التغذية'
        });
    }
});

module.exports = router;