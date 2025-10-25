const express = require('express');
const router = express.Router();
const { body, param, query, validationResult } = require('express-validator');
const AlertService = require('../services/AlertService');
const RecommendationService = require('../services/RecommendationService');
const NotificationService = require('../services/NotificationService');
const auth = require('../middleware/auth');

// Get all alerts for a user
router.get('/', [
    auth,
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('type').optional().isIn([
        'inspection_reminder', 'health_issue', 'feeding_required', 'seasonal_task',
        'weather_warning', 'equipment_maintenance', 'harvest_ready', 'queen_replacement',
        'swarm_alert', 'disease_warning', 'custom'
    ]),
    query('priority').optional().isIn(['low', 'medium', 'high']),
    query('is_read').optional().isBoolean(),
    query('is_resolved').optional().isBoolean(),
    query('hive_id').optional().isInt(),
    query('apiary_id').optional().isInt()
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
            type: req.query.type,
            priority: req.query.priority,
            is_read: req.query.is_read,
            is_resolved: req.query.is_resolved,
            hive_id: req.query.hive_id,
            apiary_id: req.query.apiary_id,
            date_from: req.query.date_from,
            date_to: req.query.date_to
        };

        const pagination = {
            page: parseInt(req.query.page) || 1,
            limit: parseInt(req.query.limit) || 20,
            sort_by: req.query.sort_by || 'created_at',
            sort_order: req.query.sort_order || 'DESC'
        };

        const result = await AlertService.getAlerts(req.user.id, filters, pagination);

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Error fetching alerts:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في جلب التنبيهات'
        });
    }
});

// Get alert by ID
router.get('/:id', [
    auth,
    param('id').isInt().withMessage('معرف التنبيه مطلوب')
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

        const alert = await AlertService.getAlertById(req.params.id, req.user.id);

        if (!alert) {
            return res.status(404).json({
                success: false,
                message: 'التنبيه غير موجود'
            });
        }

        res.json({
            success: true,
            data: alert
        });
    } catch (error) {
        console.error('Error fetching alert:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في جلب التنبيه'
        });
    }
});

// Create new alert
router.post('/', [
    auth,
    body('type').isIn([
        'inspection_reminder', 'health_issue', 'feeding_required', 'seasonal_task',
        'weather_warning', 'equipment_maintenance', 'harvest_ready', 'queen_replacement',
        'swarm_alert', 'disease_warning', 'custom'
    ]).withMessage('نوع التنبيه غير صحيح'),
    body('priority').isIn(['low', 'medium', 'high']).withMessage('أولوية التنبيه غير صحيحة'),
    body('title').isString().isLength({ min: 1, max: 200 }).withMessage('عنوان التنبيه مطلوب'),
    body('message').isString().isLength({ min: 1, max: 2000 }).withMessage('رسالة التنبيه مطلوبة'),
    body('hive_id').optional().isInt(),
    body('apiary_id').optional().isInt(),
    body('metadata').optional().isObject(),
    body('expires_at').optional().isISO8601(),
    body('send_notification').optional().isBoolean()
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

        const alertData = {
            ...req.body,
            user_id: req.user.id
        };

        const alert = await AlertService.createAlert(alertData);

        res.status(201).json({
            success: true,
            data: alert
        });
    } catch (error) {
        console.error('Error creating alert:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في إنشاء التنبيه'
        });
    }
});

// Mark alert as read
router.patch('/:id/read', [
    auth,
    param('id').isInt().withMessage('معرف التنبيه مطلوب')
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

        const success = await AlertService.markAsRead(req.params.id, req.user.id);

        if (!success) {
            return res.status(404).json({
                success: false,
                message: 'التنبيه غير موجود'
            });
        }

        res.json({
            success: true,
            message: 'تم تحديد التنبيه كمقروء'
        });
    } catch (error) {
        console.error('Error marking alert as read:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في تحديث التنبيه'
        });
    }
});

// Mark alert as resolved
router.patch('/:id/resolve', [
    auth,
    param('id').isInt().withMessage('معرف التنبيه مطلوب'),
    body('resolution_notes').optional().isString().isLength({ max: 1000 })
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

        const success = await AlertService.markAsResolved(
            req.params.id,
            req.user.id,
            req.body.resolution_notes
        );

        if (!success) {
            return res.status(404).json({
                success: false,
                message: 'التنبيه غير موجود'
            });
        }

        res.json({
            success: true,
            message: 'تم حل التنبيه'
        });
    } catch (error) {
        console.error('Error resolving alert:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في حل التنبيه'
        });
    }
});

// Delete alert
router.delete('/:id', [
    auth,
    param('id').isInt().withMessage('معرف التنبيه مطلوب')
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

        const success = await AlertService.deleteAlert(req.params.id, req.user.id);

        if (!success) {
            return res.status(404).json({
                success: false,
                message: 'التنبيه غير موجود'
            });
        }

        res.json({
            success: true,
            message: 'تم حذف التنبيه'
        });
    } catch (error) {
        console.error('Error deleting alert:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في حذف التنبيه'
        });
    }
});

// Bulk operations
router.post('/bulk/read', [
    auth,
    body('alert_ids').isArray().withMessage('قائمة معرفات التنبيهات مطلوبة'),
    body('alert_ids.*').isInt().withMessage('معرف التنبيه يجب أن يكون رقم')
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

        const updatedCount = await AlertService.bulkMarkAsRead(req.body.alert_ids, req.user.id);

        res.json({
            success: true,
            message: `تم تحديد ${updatedCount} تنبيه كمقروء`,
            updated_count: updatedCount
        });
    } catch (error) {
        console.error('Error bulk marking alerts as read:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في تحديث التنبيهات'
        });
    }
});

router.delete('/bulk', [
    auth,
    body('alert_ids').isArray().withMessage('قائمة معرفات التنبيهات مطلوبة'),
    body('alert_ids.*').isInt().withMessage('معرف التنبيه يجب أن يكون رقم')
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

        const deletedCount = await AlertService.bulkDeleteAlerts(req.body.alert_ids, req.user.id);

        res.json({
            success: true,
            message: `تم حذف ${deletedCount} تنبيه`,
            deleted_count: deletedCount
        });
    } catch (error) {
        console.error('Error bulk deleting alerts:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في حذف التنبيهات'
        });
    }
});

// Get alert statistics
router.get('/stats/summary', auth, async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 30;
        const stats = await AlertService.getAlertStats(req.user.id, days);

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Error fetching alert stats:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في جلب إحصائيات التنبيهات'
        });
    }
});

// Generate inspection reminders
router.post('/generate/inspection-reminders', auth, async (req, res) => {
    try {
        const alerts = await AlertService.generateInspectionReminders();

        res.json({
            success: true,
            message: `تم إنشاء ${alerts.length} تذكير فحص`,
            data: alerts
        });
    } catch (error) {
        console.error('Error generating inspection reminders:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في إنشاء تذكيرات الفحص'
        });
    }
});

// Generate seasonal alerts
router.post('/generate/seasonal', [
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

        const alerts = await AlertService.generateSeasonalAlerts(
            req.user.id,
            req.body.season,
            req.body.region
        );

        res.json({
            success: true,
            message: `تم إنشاء ${alerts.length} تنبيه موسمي`,
            data: alerts
        });
    } catch (error) {
        console.error('Error generating seasonal alerts:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في إنشاء التنبيهات الموسمية'
        });
    }
});

// Get recommendations for a hive
router.get('/recommendations/hive/:hiveId', [
    auth,
    param('hiveId').isInt().withMessage('معرف الخلية مطلوب')
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

        const recommendations = await RecommendationService.generateHiveRecommendations(
            req.params.hiveId,
            req.user.id
        );

        res.json({
            success: true,
            data: recommendations
        });
    } catch (error) {
        console.error('Error generating hive recommendations:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في إنشاء توصيات الخلية'
        });
    }
});

// Get recommendations for an apiary
router.get('/recommendations/apiary/:apiaryId', [
    auth,
    param('apiaryId').isInt().withMessage('معرف المنحل مطلوب')
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

        const recommendations = await RecommendationService.generateApiaryRecommendations(
            req.params.apiaryId,
            req.user.id
        );

        res.json({
            success: true,
            data: recommendations
        });
    } catch (error) {
        console.error('Error generating apiary recommendations:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في إنشاء توصيات المنحل'
        });
    }
});

// Notification preferences
router.get('/notifications/preferences', auth, async (req, res) => {
    try {
        const { User } = require('../models');
        const user = await User.findByPk(req.user.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'المستخدم غير موجود'
            });
        }

        res.json({
            success: true,
            data: user.notification_preferences || {}
        });
    } catch (error) {
        console.error('Error fetching notification preferences:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في جلب إعدادات الإشعارات'
        });
    }
});

router.put('/notifications/preferences', [
    auth,
    body('push_notifications').optional().isBoolean(),
    body('sms_notifications').optional().isBoolean(),
    body('email_notifications').optional().isBoolean(),
    body('quiet_hours').optional().isObject(),
    body('alert_types').optional().isObject()
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

        const preferences = await NotificationService.updateNotificationPreferences(
            req.user.id,
            req.body
        );

        res.json({
            success: true,
            data: preferences,
            message: 'تم تحديث إعدادات الإشعارات'
        });
    } catch (error) {
        console.error('Error updating notification preferences:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في تحديث إعدادات الإشعارات'
        });
    }
});

// Test notification
router.post('/notifications/test', [
    auth,
    body('type').optional().isIn(['push', 'sms', 'email'])
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

        const result = await NotificationService.testNotification(
            req.user.id,
            req.body.type
        );

        res.json({
            success: true,
            data: result,
            message: 'تم إرسال إشعار تجريبي'
        });
    } catch (error) {
        console.error('Error sending test notification:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في إرسال الإشعار التجريبي'
        });
    }
});

module.exports = router;