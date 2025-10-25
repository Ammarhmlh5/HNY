const express = require('express');
const { body, param, query } = require('express-validator');
const HiveService = require('../services/HiveService');
const { authenticate } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validation');
const { AppError } = require('../middleware/errorHandler');

const router = express.Router();
const hiveService = new HiveService();

// Middleware to authenticate all hive routes
router.use(authenticate);

/**
 * Create new hive
 * POST /api/hives/apiary/:apiaryId
 */
router.post('/apiary/:apiaryId',
    [
        param('apiaryId').isUUID().withMessage('معرف المنحل غير صحيح'),
        body('name').isLength({ min: 1, max: 50 }).withMessage('اسم الخلية مطلوب ويجب أن يكون أقل من 50 حرف'),
        body('type').isIn(['بلدي', 'أمريكي', 'كيني', 'وارية', 'دادان', 'other']).withMessage('نوع الخلية غير صحيح'),
        body('position.row').isInt({ min: 1 }).withMessage('رقم الصف مطلوب ويجب أن يكون رقم موجب'),
        body('position.column').isInt({ min: 1 }).withMessage('رقم العمود مطلوب ويجب أن يكون رقم موجب'),
        body('specifications.frame_count').isInt({ min: 1, max: 50 }).withMessage('عدد الإطارات يجب أن يكون بين 1 و 50'),
        body('specifications.dimensions').isObject().withMessage('أبعاد الخلية مطلوبة'),
        body('colony.age').isInt({ min: 0 }).withMessage('عمر الطائفة يجب أن يكون رقم موجب'),
        body('colony.queen_age').isInt({ min: 0 }).withMessage('عمر الملكة يجب أن يكون رقم موجب'),
        body('colony.source').isString().withMessage('مصدر الطائفة مطلوب')
    ],
    validateRequest,
    async (req, res, next) => {
        try {
            const { apiaryId } = req.params;
            const userId = req.user.id;
            const hiveData = req.body;

            const hive = await hiveService.createHive(apiaryId, userId, hiveData);

            res.status(201).json({
                success: true,
                message: 'تم إنشاء الخلية بنجاح',
                data: hive
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * Get hive by ID
 * GET /api/hives/:hiveId
 */
router.get('/:hiveId',
    [
        param('hiveId').isUUID().withMessage('معرف الخلية غير صحيح'),
        query('include_supers').optional().isBoolean().withMessage('include_supers يجب أن يكون boolean'),
        query('include_frames').optional().isBoolean().withMessage('include_frames يجب أن يكون boolean'),
        query('include_inspections').optional().isBoolean().withMessage('include_inspections يجب أن يكون boolean'),
        query('inspection_limit').optional().isInt({ min: 1, max: 20 }).withMessage('حد الفحوصات يجب أن يكون بين 1 و 20')
    ],
    validateRequest,
    async (req, res, next) => {
        try {
            const { hiveId } = req.params;
            const userId = req.user.id;
            const options = {
                includeSupers: req.query.include_supers === 'true',
                includeFrames: req.query.include_frames === 'true',
                includeInspections: req.query.include_inspections === 'true',
                inspectionLimit: parseInt(req.query.inspection_limit) || 5
            };

            const hive = await hiveService.getHive(hiveId, userId, options);

            res.json({
                success: true,
                data: hive
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * Update hive
 * PUT /api/hives/:hiveId
 */
router.put('/:hiveId',
    [
        param('hiveId').isUUID().withMessage('معرف الخلية غير صحيح'),
        body('name').optional().isLength({ min: 1, max: 50 }).withMessage('اسم الخلية يجب أن يكون أقل من 50 حرف'),
        body('type').optional().isIn(['بلدي', 'أمريكي', 'كيني', 'وارية', 'دادان', 'other']).withMessage('نوع الخلية غير صحيح'),
        body('position.row').optional().isInt({ min: 1 }).withMessage('رقم الصف يجب أن يكون رقم موجب'),
        body('position.column').optional().isInt({ min: 1 }).withMessage('رقم العمود يجب أن يكون رقم موجب'),
        body('status').optional().isIn(['active', 'queenless', 'dead', 'combined']).withMessage('حالة الخلية غير صحيحة'),
        body('colony.age').optional().isInt({ min: 0 }).withMessage('عمر الطائفة يجب أن يكون رقم موجب'),
        body('colony.queen_age').optional().isInt({ min: 0 }).withMessage('عمر الملكة يجب أن يكون رقم موجب')
    ],
    validateRequest,
    async (req, res, next) => {
        try {
            const { hiveId } = req.params;
            const userId = req.user.id;
            const updateData = req.body;

            const hive = await hiveService.updateHive(hiveId, userId, updateData);

            res.json({
                success: true,
                message: 'تم تحديث الخلية بنجاح',
                data: hive
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * Delete hive
 * DELETE /api/hives/:hiveId
 */
router.delete('/:hiveId',
    [
        param('hiveId').isUUID().withMessage('معرف الخلية غير صحيح')
    ],
    validateRequest,
    async (req, res, next) => {
        try {
            const { hiveId } = req.params;
            const userId = req.user.id;

            await hiveService.deleteHive(hiveId, userId);

            res.json({
                success: true,
                message: 'تم حذف الخلية بنجاح'
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * Get hive statistics
 * GET /api/hives/:hiveId/statistics
 */
router.get('/:hiveId/statistics',
    [
        param('hiveId').isUUID().withMessage('معرف الخلية غير صحيح')
    ],
    validateRequest,
    async (req, res, next) => {
        try {
            const { hiveId } = req.params;
            const userId = req.user.id;

            const statistics = await hiveService.getHiveStatistics(hiveId, userId);

            res.json({
                success: true,
                data: statistics
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * Get hive recommendations
 * GET /api/hives/:hiveId/recommendations
 */
router.get('/:hiveId/recommendations',
    [
        param('hiveId').isUUID().withMessage('معرف الخلية غير صحيح')
    ],
    validateRequest,
    async (req, res, next) => {
        try {
            const { hiveId } = req.params;
            const userId = req.user.id;

            const recommendations = await hiveService.getHiveRecommendations(hiveId, userId);

            res.json({
                success: true,
                data: recommendations
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * Manage hive supers
 * POST /api/hives/:hiveId/manage-supers
 */
router.post('/:hiveId/manage-supers',
    [
        param('hiveId').isUUID().withMessage('معرف الخلية غير صحيح'),
        body('action').isIn(['add_super', 'remove_super', 'reorder_supers']).withMessage('الإجراء غير صحيح'),
        body('superData').optional().isObject().withMessage('بيانات العسلة يجب أن تكون كائن')
    ],
    validateRequest,
    async (req, res, next) => {
        try {
            const { hiveId } = req.params;
            const userId = req.user.id;
            const { action, superData } = req.body;

            const result = await hiveService.manageHiveSupers(hiveId, userId, { action, superData });

            res.json({
                success: true,
                message: `تم ${action === 'add_super' ? 'إضافة' : action === 'remove_super' ? 'حذف' : 'إعادة ترتيب'} العسلات بنجاح`,
                data: result
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * Calculate hive performance
 * GET /api/hives/:hiveId/performance
 */
router.get('/:hiveId/performance',
    [
        param('hiveId').isUUID().withMessage('معرف الخلية غير صحيح'),
        query('period').optional().isIn(['month', 'quarter', 'year']).withMessage('فترة التحليل غير صحيحة')
    ],
    validateRequest,
    async (req, res, next) => {
        try {
            const { hiveId } = req.params;
            const userId = req.user.id;
            const options = {
                period: req.query.period || 'year'
            };

            const performance = await hiveService.calculateHivePerformance(hiveId, userId, options);

            res.json({
                success: true,
                data: performance
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * Compare hive with apiary
 * GET /api/hives/:hiveId/compare
 */
router.get('/:hiveId/compare',
    [
        param('hiveId').isUUID().withMessage('معرف الخلية غير صحيح')
    ],
    validateRequest,
    async (req, res, next) => {
        try {
            const { hiveId } = req.params;
            const userId = req.user.id;

            const comparison = await hiveService.compareHiveWithApiary(hiveId, userId);

            res.json({
                success: true,
                data: comparison
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * Get hives by apiary
 * GET /api/hives/apiary/:apiaryId
 */
router.get('/apiary/:apiaryId',
    [
        param('apiaryId').isUUID().withMessage('معرف المنحل غير صحيح'),
        query('status').optional().isIn(['active', 'queenless', 'dead', 'combined']).withMessage('حالة الخلية غير صحيحة'),
        query('health_status').optional().isIn(['excellent', 'good', 'warning', 'critical']).withMessage('الحالة الصحية غير صحيحة'),
        query('include_stats').optional().isBoolean().withMessage('include_stats يجب أن يكون boolean'),
        query('sort_by').optional().isIn(['name', 'health_score', 'last_inspection', 'created_at']).withMessage('ترتيب غير صحيح'),
        query('sort_order').optional().isIn(['ASC', 'DESC']).withMessage('اتجاه الترتيب غير صحيح')
    ],
    validateRequest,
    async (req, res, next) => {
        try {
            const { apiaryId } = req.params;
            const userId = req.user.id;

            // Verify user owns the apiary
            const { Apiary } = require('../models');
            const apiary = await Apiary.findOne({
                where: { id: apiaryId, owner_id: userId }
            });

            if (!apiary) {
                throw new AppError('المنحل غير موجود', 404, 'APIARY_NOT_FOUND');
            }

            // Build query options
            const whereClause = { apiary_id: apiaryId };

            if (req.query.status) {
                whereClause.status = req.query.status;
            }

            if (req.query.health_status) {
                whereClause.health_status = req.query.health_status;
            }

            const includeArray = [{
                model: Apiary,
                as: 'apiary',
                attributes: ['id', 'name']
            }];

            if (req.query.include_stats === 'true') {
                const { Inspection } = require('../models');
                includeArray.push({
                    model: Inspection,
                    as: 'inspections',
                    limit: 1,
                    order: [['inspection_date', 'DESC']]
                });
            }

            const { Hive } = require('../models');
            const hives = await Hive.findAll({
                where: whereClause,
                include: includeArray,
                order: [[req.query.sort_by || 'name', req.query.sort_order || 'ASC']]
            });

            res.json({
                success: true,
                data: {
                    apiary: {
                        id: apiary.id,
                        name: apiary.name
                    },
                    hives,
                    count: hives.length
                }
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * Get user's hive summary
 * GET /api/hives/summary
 */
router.get('/summary',
    async (req, res, next) => {
        try {
            const userId = req.user.id;

            // Get all user's hives
            const { Hive, Apiary, Inspection } = require('../models');
            const hives = await Hive.findAll({
                include: [{
                    model: Apiary,
                    as: 'apiary',
                    where: { owner_id: userId },
                    attributes: ['id', 'name']
                }, {
                    model: Inspection,
                    as: 'inspections',
                    limit: 1,
                    order: [['inspection_date', 'DESC']]
                }]
            });

            const summary = {
                total_hives: hives.length,
                status_distribution: {
                    active: 0,
                    queenless: 0,
                    dead: 0,
                    combined: 0
                },
                health_distribution: {
                    excellent: 0,
                    good: 0,
                    warning: 0,
                    critical: 0,
                    unknown: 0
                },
                recent_activity: {
                    inspections_this_week: 0,
                    overdue_inspections: 0,
                    critical_hives: 0
                },
                performance_metrics: {
                    average_health_score: 0,
                    total_estimated_honey: 0,
                    productive_hives: 0
                }
            };

            const currentDate = new Date();
            const weekAgo = new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000);
            let totalHealthScore = 0;
            let hivesWithScore = 0;

            hives.forEach(hive => {
                // Status distribution
                summary.status_distribution[hive.status]++;

                // Health distribution
                if (hive.health_status) {
                    summary.health_distribution[hive.health_status]++;
                } else {
                    summary.health_distribution.unknown++;
                }

                // Health score average
                if (hive.health_score !== null) {
                    totalHealthScore += hive.health_score;
                    hivesWithScore++;
                }

                // Recent activity
                if (hive.inspections && hive.inspections.length > 0) {
                    const lastInspection = new Date(hive.inspections[0].inspection_date);
                    if (lastInspection >= weekAgo) {
                        summary.recent_activity.inspections_this_week++;
                    }
                }

                // Overdue inspections (no inspection for 30+ days)
                if (hive.last_inspection) {
                    const daysSinceInspection = Math.floor(
                        (currentDate - new Date(hive.last_inspection)) / (1000 * 60 * 60 * 24)
                    );
                    if (daysSinceInspection > 30) {
                        summary.recent_activity.overdue_inspections++;
                    }
                } else {
                    summary.recent_activity.overdue_inspections++;
                }

                // Critical hives
                if (hive.health_status === 'critical' || hive.status === 'queenless') {
                    summary.recent_activity.critical_hives++;
                }

                // Productive hives (simplified calculation)
                if (hive.status === 'active' && hive.health_status &&
                    ['excellent', 'good'].includes(hive.health_status)) {
                    summary.performance_metrics.productive_hives++;
                }
            });

            // Calculate averages
            if (hivesWithScore > 0) {
                summary.performance_metrics.average_health_score = Math.round(
                    totalHealthScore / hivesWithScore
                );
            }

            res.json({
                success: true,
                data: summary
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * Bulk update hives
 * PUT /api/hives/bulk-update
 */
router.put('/bulk-update',
    [
        body('hive_ids').isArray({ min: 1 }).withMessage('قائمة معرفات الخلايا مطلوبة'),
        body('hive_ids.*').isUUID().withMessage('معرف خلية غير صحيح'),
        body('update_data').isObject().withMessage('بيانات التحديث مطلوبة'),
        body('update_data.status').optional().isIn(['active', 'queenless', 'dead', 'combined']).withMessage('حالة الخلية غير صحيحة')
    ],
    validateRequest,
    async (req, res, next) => {
        try {
            const userId = req.user.id;
            const { hive_ids, update_data } = req.body;

            // Verify all hives belong to user
            const { Hive, Apiary } = require('../models');
            const hives = await Hive.findAll({
                where: {
                    id: { [Hive.sequelize.Sequelize.Op.in]: hive_ids }
                },
                include: [{
                    model: Apiary,
                    as: 'apiary',
                    where: { owner_id: userId }
                }]
            });

            if (hives.length !== hive_ids.length) {
                throw new AppError('بعض الخلايا غير موجودة أو غير مملوكة للمستخدم', 400, 'INVALID_HIVES');
            }

            // Update all hives
            await Hive.update(update_data, {
                where: { id: { [Hive.sequelize.Sequelize.Op.in]: hive_ids } }
            });

            res.json({
                success: true,
                message: `تم تحديث ${hive_ids.length} خلية بنجاح`,
                data: {
                    updated_count: hive_ids.length,
                    update_data
                }
            });
        } catch (error) {
            next(error);
        }
    }
);

module.exports = router;