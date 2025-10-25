const express = require('express');
const router = express.Router();
const { body, param, query, validationResult } = require('express-validator');
const FeedingPlannerService = require('../services/FeedingPlannerService');
const { FeedingPlan } = require('../models');
const auth = require('../middleware/auth');

// Get all feeding plans for a user
router.get('/', [
    auth,
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('plan_type').optional().isIn([
        'emergency', 'stimulative', 'maintenance', 'winter_prep',
        'spring_buildup', 'seasonal', 'custom'
    ]),
    query('is_active').optional().isBoolean(),
    query('season').optional().isIn(['spring', 'summer', 'autumn', 'winter']),
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
            plan_type: req.query.plan_type,
            is_active: req.query.is_active,
            season: req.query.season,
            date_from: req.query.date_from,
            date_to: req.query.date_to
        };

        const pagination = {
            page: parseInt(req.query.page) || 1,
            limit: parseInt(req.query.limit) || 20,
            sort_by: req.query.sort_by || 'created_at',
            sort_order: req.query.sort_order || 'DESC'
        };

        const result = await FeedingPlannerService.getFeedingPlans(req.user.id, filters, pagination);

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Error fetching feeding plans:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في جلب خطط التغذية'
        });
    }
});

// Get feeding plan by ID
router.get('/:id', [
    auth,
    param('id').isInt().withMessage('معرف الخطة مطلوب')
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

        const plan = await FeedingPlan.findOne({
            where: {
                id: req.params.id,
                user_id: req.user.id
            }
        });

        if (!plan) {
            return res.status(404).json({
                success: false,
                message: 'خطة التغذية غير موجودة'
            });
        }

        res.json({
            success: true,
            data: plan
        });
    } catch (error) {
        console.error('Error fetching feeding plan:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في جلب خطة التغذية'
        });
    }
});

// Create new feeding plan
router.post('/', [
    auth,
    body('name').isString().isLength({ min: 1, max: 200 }).withMessage('اسم الخطة مطلوب'),
    body('description').optional().isString().isLength({ max: 2000 }),
    body('plan_type').isIn([
        'emergency', 'stimulative', 'maintenance', 'winter_prep',
        'spring_buildup', 'seasonal', 'custom'
    ]).withMessage('نوع الخطة غير صحيح'),
    body('primary_feeding_type').isIn([
        'sugar_syrup', 'honey_syrup', 'pollen_patty', 'protein_patty',
        'emergency_feeding', 'winter_feeding', 'stimulative_feeding',
        'maintenance_feeding', 'candy_board', 'fondant'
    ]).withMessage('نوع التغذية الأساسي غير صحيح'),
    body('feeding_method').optional().isIn([
        'top_feeder', 'entrance_feeder', 'boardman_feeder', 'frame_feeder',
        'baggie_feeder', 'patty_placement', 'candy_board', 'other'
    ]),
    body('start_date').isISO8601().withMessage('تاريخ البداية مطلوب'),
    body('end_date').isISO8601().withMessage('تاريخ النهاية مطلوب'),
    body('season').optional().isIn(['spring', 'summer', 'autumn', 'winter']),
    body('target_hives').optional().isArray(),
    body('target_apiaries').optional().isArray(),
    body('frequency_days').optional().isInt({ min: 1, max: 30 }),
    body('auto_adjust_frequency').optional().isBoolean(),
    body('auto_generate_schedule').optional().isBoolean(),
    body('estimated_total_cost').optional().isDecimal(),
    body('is_recurring').optional().isBoolean(),
    body('recurrence_pattern').optional().isObject(),
    body('notifications_enabled').optional().isBoolean(),
    body('reminder_days_before').optional().isInt({ min: 0, max: 7 })
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

        // Validate date range
        const startDate = new Date(req.body.start_date);
        const endDate = new Date(req.body.end_date);

        if (endDate <= startDate) {
            return res.status(400).json({
                success: false,
                message: 'تاريخ النهاية يجب أن يكون بعد تاريخ البداية'
            });
        }

        const planData = {
            ...req.body,
            user_id: req.user.id
        };

        const plan = await FeedingPlannerService.createFeedingPlan(planData);

        res.status(201).json({
            success: true,
            data: plan
        });
    } catch (error) {
        console.error('Error creating feeding plan:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في إنشاء خطة التغذية'
        });
    }
});

// Update feeding plan
router.put('/:id', [
    auth,
    param('id').isInt().withMessage('معرف الخطة مطلوب'),
    body('name').optional().isString().isLength({ min: 1, max: 200 }),
    body('description').optional().isString().isLength({ max: 2000 }),
    body('plan_type').optional().isIn([
        'emergency', 'stimulative', 'maintenance', 'winter_prep',
        'spring_buildup', 'seasonal', 'custom'
    ]),
    body('primary_feeding_type').optional().isIn([
        'sugar_syrup', 'honey_syrup', 'pollen_patty', 'protein_patty',
        'emergency_feeding', 'winter_feeding', 'stimulative_feeding',
        'maintenance_feeding', 'candy_board', 'fondant'
    ]),
    body('start_date').optional().isISO8601(),
    body('end_date').optional().isISO8601(),
    body('frequency_days').optional().isInt({ min: 1, max: 30 }),
    body('is_active').optional().isBoolean(),
    body('notifications_enabled').optional().isBoolean()
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

        const plan = await FeedingPlannerService.updateFeedingPlan(
            req.params.id,
            req.body,
            req.user.id
        );

        if (!plan) {
            return res.status(404).json({
                success: false,
                message: 'خطة التغذية غير موجودة'
            });
        }

        res.json({
            success: true,
            data: plan
        });
    } catch (error) {
        console.error('Error updating feeding plan:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في تحديث خطة التغذية'
        });
    }
});

// Delete feeding plan
router.delete('/:id', [
    auth,
    param('id').isInt().withMessage('معرف الخطة مطلوب')
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

        const success = await FeedingPlannerService.deleteFeedingPlan(req.params.id, req.user.id);

        if (!success) {
            return res.status(404).json({
                success: false,
                message: 'خطة التغذية غير موجودة'
            });
        }

        res.json({
            success: true,
            message: 'تم حذف خطة التغذية بنجاح'
        });
    } catch (error) {
        console.error('Error deleting feeding plan:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في حذف خطة التغذية'
        });
    }
});

// Toggle plan active status
router.patch('/:id/toggle', [
    auth,
    param('id').isInt().withMessage('معرف الخطة مطلوب')
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

        const plan = await FeedingPlannerService.togglePlanStatus(req.params.id, req.user.id);

        if (!plan) {
            return res.status(404).json({
                success: false,
                message: 'خطة التغذية غير موجودة'
            });
        }

        res.json({
            success: true,
            data: plan,
            message: plan.is_active ? 'تم تفعيل الخطة' : 'تم إلغاء تفعيل الخطة'
        });
    } catch (error) {
        console.error('Error toggling plan status:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في تغيير حالة الخطة'
        });
    }
});

// Generate shopping list for a plan
router.get('/:id/shopping-list', [
    auth,
    param('id').isInt().withMessage('معرف الخطة مطلوب')
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

        const shoppingList = await FeedingPlannerService.generateShoppingList(req.params.id);

        res.json({
            success: true,
            data: shoppingList
        });
    } catch (error) {
        console.error('Error generating shopping list:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في إنشاء قائمة التسوق'
        });
    }
});

// Get plan statistics
router.get('/:id/statistics', [
    auth,
    param('id').isInt().withMessage('معرف الخطة مطلوب')
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

        const stats = await FeedingPlannerService.getPlanStatistics(req.params.id);

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Error getting plan statistics:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في جلب إحصائيات الخطة'
        });
    }
});

// Generate feeding calendar
router.get('/calendar/view', [
    auth,
    query('start_date').isISO8601().withMessage('تاريخ البداية مطلوب'),
    query('end_date').isISO8601().withMessage('تاريخ النهاية مطلوب')
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

        const calendar = await FeedingPlannerService.generateFeedingCalendar(
            req.user.id,
            req.query.start_date,
            req.query.end_date
        );

        res.json({
            success: true,
            data: calendar
        });
    } catch (error) {
        console.error('Error generating feeding calendar:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في إنشاء تقويم التغذية'
        });
    }
});

// Create feeding reminders
router.post('/reminders/create', auth, async (req, res) => {
    try {
        const reminders = await FeedingPlannerService.createFeedingReminders();

        res.json({
            success: true,
            data: reminders,
            message: `تم إنشاء ${reminders.length} تذكير`
        });
    } catch (error) {
        console.error('Error creating feeding reminders:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في إنشاء التذكيرات'
        });
    }
});

// Check overdue feedings
router.post('/overdue/check', auth, async (req, res) => {
    try {
        const alerts = await FeedingPlannerService.checkOverdueFeedings();

        res.json({
            success: true,
            data: alerts,
            message: `تم إنشاء ${alerts.length} تنبيه للتغذيات المتأخرة`
        });
    } catch (error) {
        console.error('Error checking overdue feedings:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في فحص التغذيات المتأخرة'
        });
    }
});

// Create seasonal recommendations
router.post('/seasonal/recommendations', [
    auth,
    body('season').isIn(['spring', 'summer', 'autumn', 'winter']).withMessage('الموسم غير صحيح'),
    body('region').optional().isString()
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

        const recommendations = await FeedingPlannerService.createSeasonalRecommendations(
            req.user.id,
            req.body.season,
            req.body.region
        );

        res.json({
            success: true,
            data: recommendations,
            message: `تم إنشاء ${recommendations.length} توصية موسمية`
        });
    } catch (error) {
        console.error('Error creating seasonal recommendations:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في إنشاء التوصيات الموسمية'
        });
    }
});

// Get active plans
router.get('/active/list', auth, async (req, res) => {
    try {
        const activePlans = await FeedingPlan.getActivePlans(req.user.id);

        res.json({
            success: true,
            data: activePlans
        });
    } catch (error) {
        console.error('Error fetching active plans:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في جلب الخطط النشطة'
        });
    }
});

// Get upcoming plans
router.get('/upcoming/list', [
    auth,
    query('days').optional().isInt({ min: 1, max: 30 })
], async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 7;
        const upcomingPlans = await FeedingPlan.getUpcomingPlans(req.user.id, days);

        res.json({
            success: true,
            data: upcomingPlans
        });
    } catch (error) {
        console.error('Error fetching upcoming plans:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في جلب الخطط القادمة'
        });
    }
});

module.exports = router;