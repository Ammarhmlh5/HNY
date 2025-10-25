const express = require('express');
const { body, param, query } = require('express-validator');
const FrameService = require('../services/FrameService');
const { authenticate } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validation');
const { AppError } = require('../middleware/errorHandler');

const router = express.Router();
const frameService = new FrameService();

// Middleware to authenticate all frame routes
router.use(authenticate);

/**
 * Create frames for hive
 * POST /api/frames/hive/:hiveId
 */
router.post('/hive/:hiveId',
    [
        param('hiveId').isUUID().withMessage('معرف الخلية غير صحيح'),
        body('foundation_type').optional().isIn(['wired', 'unwired', 'plastic', 'natural'])
            .withMessage('نوع الأساس غير صحيح'),
        body('initial_type').optional().isIn(['brood', 'honey', 'pollen', 'mixed', 'empty', 'foundation'])
            .withMessage('نوع الإطار الأولي غير صحيح')
    ],
    validateRequest,
    async (req, res, next) => {
        try {
            const { hiveId } = req.params;
            const userId = req.user.id;
            const options = req.body;

            const frames = await frameService.createFramesForHive(hiveId, userId, options);

            res.status(201).json({
                success: true,
                message: 'تم إنشاء الإطارات بنجاح',
                data: {
                    frames,
                    count: frames.length
                }
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * Create frames for super
 * POST /api/frames/super/:superId
 */
router.post('/super/:superId',
    [
        param('superId').isUUID().withMessage('معرف العسلة غير صحيح'),
        body('foundation_type').optional().isIn(['wired', 'unwired', 'plastic', 'natural'])
            .withMessage('نوع الأساس غير صحيح')
    ],
    validateRequest,
    async (req, res, next) => {
        try {
            const { superId } = req.params;
            const userId = req.user.id;
            const options = req.body;

            const frames = await frameService.createFramesForSuper(superId, userId, options);

            res.status(201).json({
                success: true,
                message: 'تم إنشاء إطارات العسلة بنجاح',
                data: {
                    frames,
                    count: frames.length
                }
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * Get hive frame analysis
 * GET /api/frames/hive/:hiveId/analysis
 */
router.get('/hive/:hiveId/analysis',
    [
        param('hiveId').isUUID().withMessage('معرف الخلية غير صحيح')
    ],
    validateRequest,
    async (req, res, next) => {
        try {
            const { hiveId } = req.params;
            const userId = req.user.id;

            const analysis = await frameService.getHiveFrameAnalysis(hiveId, userId);

            res.json({
                success: true,
                data: analysis
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * Get frames needing attention
 * GET /api/frames/hive/:hiveId/attention
 */
router.get('/hive/:hiveId/attention',
    [
        param('hiveId').isUUID().withMessage('معرف الخلية غير صحيح')
    ],
    validateRequest,
    async (req, res, next) => {
        try {
            const { hiveId } = req.params;
            const userId = req.user.id;

            const frames = await frameService.getFramesNeedingAttention(hiveId, userId);

            res.json({
                success: true,
                data: {
                    frames,
                    count: frames.length
                }
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * Get frame recommendations
 * GET /api/frames/hive/:hiveId/recommendations
 */
router.get('/hive/:hiveId/recommendations',
    [
        param('hiveId').isUUID().withMessage('معرف الخلية غير صحيح')
    ],
    validateRequest,
    async (req, res, next) => {
        try {
            const { hiveId } = req.params;
            const userId = req.user.id;

            const recommendations = await frameService.getFrameRecommendations(hiveId, userId);

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
 * Update frame content
 * PUT /api/frames/:frameId/content
 */
router.put('/:frameId/content',
    [
        param('frameId').isUUID().withMessage('معرف الإطار غير صحيح'),
        body('brood_percentage').optional().isFloat({ min: 0, max: 100 })
            .withMessage('نسبة الحضنة يجب أن تكون بين 0 و 100'),
        body('honey_percentage').optional().isFloat({ min: 0, max: 100 })
            .withMessage('نسبة العسل يجب أن تكون بين 0 و 100'),
        body('pollen_percentage').optional().isFloat({ min: 0, max: 100 })
            .withMessage('نسبة اللقاح يجب أن تكون بين 0 و 100'),
        body('brood_details').optional().isObject().withMessage('تفاصيل الحضنة يجب أن تكون كائن'),
        body('honey_details').optional().isObject().withMessage('تفاصيل العسل يجب أن تكون كائن'),
        body('pollen_details').optional().isObject().withMessage('تفاصيل اللقاح يجب أن تكون كائن')
    ],
    validateRequest,
    async (req, res, next) => {
        try {
            const { frameId } = req.params;
            const userId = req.user.id;
            const inspectionData = req.body;

            // Validate total percentage doesn't exceed 100%
            const totalPercentage = (inspectionData.brood_percentage || 0) +
                (inspectionData.honey_percentage || 0) +
                (inspectionData.pollen_percentage || 0);

            if (totalPercentage > 100) {
                throw new AppError('مجموع النسب لا يمكن أن يتجاوز 100%', 400, 'INVALID_PERCENTAGES');
            }

            const frame = await frameService.updateFrameContent(frameId, userId, inspectionData);

            res.json({
                success: true,
                message: 'تم تحديث محتوى الإطار بنجاح',
                data: frame
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * Schedule frame replacement
 * POST /api/frames/:frameId/schedule-replacement
 */
router.post('/:frameId/schedule-replacement',
    [
        param('frameId').isUUID().withMessage('معرف الإطار غير صحيح'),
        body('reason').optional().isString().withMessage('سبب الاستبدال يجب أن يكون نص')
    ],
    validateRequest,
    async (req, res, next) => {
        try {
            const { frameId } = req.params;
            const userId = req.user.id;
            const { reason } = req.body;

            const frame = await frameService.scheduleFrameReplacement(frameId, userId, reason);

            res.json({
                success: true,
                message: 'تم جدولة استبدال الإطار بنجاح',
                data: {
                    frame_id: frame.id,
                    replacement_scheduled: frame.replacement_scheduled,
                    reason: frame.attention_reason
                }
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * Replace frame
 * POST /api/frames/:frameId/replace
 */
router.post('/:frameId/replace',
    [
        param('frameId').isUUID().withMessage('معرف الإطار غير صحيح'),
        body('foundation_type').optional().isIn(['wired', 'unwired', 'plastic', 'natural'])
            .withMessage('نوع الأساس غير صحيح'),
        body('reason').optional().isString().withMessage('سبب الاستبدال يجب أن يكون نص')
    ],
    validateRequest,
    async (req, res, next) => {
        try {
            const { frameId } = req.params;
            const userId = req.user.id;
            const newFrameData = req.body;

            const newFrame = await frameService.replaceFrame(frameId, userId, newFrameData);

            res.json({
                success: true,
                message: 'تم استبدال الإطار بنجاح',
                data: newFrame
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * Move frame
 * PUT /api/frames/:frameId/move
 */
router.put('/:frameId/move',
    [
        param('frameId').isUUID().withMessage('معرف الإطار غير صحيح'),
        body('new_position').isInt({ min: 1, max: 20 }).withMessage('الموضع الجديد يجب أن يكون بين 1 و 20'),
        body('new_super_id').optional().isUUID().withMessage('معرف العسلة الجديد غير صحيح')
    ],
    validateRequest,
    async (req, res, next) => {
        try {
            const { frameId } = req.params;
            const userId = req.user.id;
            const { new_position, new_super_id } = req.body;

            const frame = await frameService.moveFrame(frameId, userId, new_position, new_super_id);

            res.json({
                success: true,
                message: 'تم نقل الإطار بنجاح',
                data: frame
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * Bulk update frames
 * PUT /api/frames/hive/:hiveId/bulk-update
 */
router.put('/hive/:hiveId/bulk-update',
    [
        param('hiveId').isUUID().withMessage('معرف الخلية غير صحيح'),
        body('updates').isArray({ min: 1 }).withMessage('يجب تقديم قائمة بالتحديثات'),
        body('updates.*.frame_id').isUUID().withMessage('معرف الإطار غير صحيح')
    ],
    validateRequest,
    async (req, res, next) => {
        try {
            const { hiveId } = req.params;
            const userId = req.user.id;
            const { updates } = req.body;

            const updatedFrames = await frameService.bulkUpdateFrames(hiveId, userId, updates);

            res.json({
                success: true,
                message: `تم تحديث ${updatedFrames.length} إطار بنجاح`,
                data: {
                    updated_frames: updatedFrames,
                    count: updatedFrames.length
                }
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * Get frame by ID
 * GET /api/frames/:frameId
 */
router.get('/:frameId',
    [
        param('frameId').isUUID().withMessage('معرف الإطار غير صحيح')
    ],
    validateRequest,
    async (req, res, next) => {
        try {
            const { frameId } = req.params;
            const userId = req.user.id;

            const frame = await Frame.findOne({
                where: { id: frameId },
                include: [{
                    model: Hive,
                    as: 'hive',
                    include: [{
                        model: Apiary,
                        as: 'apiary',
                        where: { owner_id: userId }
                    }]
                }, {
                    model: Super,
                    as: 'super'
                }]
            });

            if (!frame) {
                throw new AppError('الإطار غير موجود', 404, 'FRAME_NOT_FOUND');
            }

            // Add calculated properties
            const frameData = {
                ...frame.toJSON(),
                quality_score: frame.quality_score,
                productivity_rating: frame.getProductivityRating(),
                replacement_urgency: frame.getReplacementUrgency(),
                estimated_honey_weight: frame.estimateHoneyWeight()
            };

            res.json({
                success: true,
                data: frameData
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * Delete frame
 * DELETE /api/frames/:frameId
 */
router.delete('/:frameId',
    [
        param('frameId').isUUID().withMessage('معرف الإطار غير صحيح')
    ],
    validateRequest,
    async (req, res, next) => {
        try {
            const { frameId } = req.params;
            const userId = req.user.id;

            const frame = await Frame.findOne({
                where: { id: frameId },
                include: [{
                    model: Hive,
                    as: 'hive',
                    include: [{
                        model: Apiary,
                        as: 'apiary',
                        where: { owner_id: userId }
                    }]
                }]
            });

            if (!frame) {
                throw new AppError('الإطار غير موجود', 404, 'FRAME_NOT_FOUND');
            }

            await frame.destroy();

            res.json({
                success: true,
                message: 'تم حذف الإطار بنجاح'
            });
        } catch (error) {
            next(error);
        }
    }
);

module.exports = router;