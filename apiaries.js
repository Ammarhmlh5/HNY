const express = require('express');
const { body, param, query } = require('express-validator');
const ApiaryService = require('../services/ApiaryService');
const { authenticate } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validation');
const { AppError } = require('../middleware/errorHandler');

const router = express.Router();
const apiaryService = new ApiaryService();

// Middleware to authenticate all apiary routes
router.use(authenticate);

/**
 * Create new apiary
 * POST /api/apiaries
 */
router.post('/',
    [
        body('name').isLength({ min: 1, max: 100 }).withMessage('اسم المنحل مطلوب ويجب أن يكون أقل من 100 حرف'),
        body('type').isIn(['fixed', 'mobile']).withMessage('نوع المنحل يجب أن يكون ثابت أو متنقل'),
        body('location.latitude').isFloat({ min: -90, max: 90 }).withMessage('خط العرض غير صحيح'),
        body('location.longitude').isFloat({ min: -180, max: 180 }).withMessage('خط الطول غير صحيح'),
        body('location.address').optional().isString().withMessage('العنوان يجب أن يكون نص'),
        body('area').optional().isFloat({ min: 0 }).withMessage('المساحة يجب أن تكون رقم موجب'),
        body('capacity').optional().isInt({ min: 1 }).withMessage('السعة يجب أن تكون رقم صحيح موجب'),
        body('description').optional().isString().withMessage('الوصف يجب أن يكون نص')
    ],
    validateRequest,
    async (req, res, next) => {
        try {
            const userId = req.user.id;
            const apiaryData = req.body;

            const apiary = await apiaryService.createApiary(userId, apiaryData);

            res.status(201).json({
                success: true,
                message: 'تم إنشاء المنحل بنجاح',
                data: apiary
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * Get user's apiaries
 * GET /api/apiaries
 */
router.get('/',
    [
        query('type').optional().isIn(['fixed', 'mobile']).withMessage('نوع المنحل غير صحيح'),
        query('include_stats').optional().isBoolean().withMessage('include_stats يجب أن يكون boolean'),
        query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('الحد الأقصى يجب أن يكون بين 1 و 100'),
        query('offset').optional().isInt({ min: 0 }).withMessage('الإزاحة يجب أن تكون رقم موجب'),
        query('sort_by').optional().isIn(['name', 'created_at', 'updated_at']).withMessage('ترتيب غير صحيح'),
        query('sort_order').optional().isIn(['ASC', 'DESC']).withMessage('اتجاه الترتيب غير صحيح')
    ],
    validateRequest,
    async (req, res, next) => {
        try {
            const userId = req.user.id;
            const options = {
                type: req.query.type || null,
                includeStats: req.query.include_stats === 'true',
                limit: parseInt(req.query.limit) || 50,
                offset: parseInt(req.query.offset) || 0,
                sortBy: req.query.sort_by || 'created_at',
                sortOrder: req.query.sort_order || 'DESC'
            };

            const apiaries = await apiaryService.getUserApiaries(userId, options);

            res.json({
                success: true,
                data: {
                    apiaries,
                    count: apiaries.length
                }
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * Get apiary by ID
 * GET /api/apiaries/:apiaryId
 */
router.get('/:apiaryId',
    [
        param('apiaryId').isUUID().withMessage('معرف المنحل غير صحيح'),
        query('include_hives').optional().isBoolean().withMessage('include_hives يجب أن يكون boolean'),
        query('include_stats').optional().isBoolean().withMessage('include_stats يجب أن يكون boolean')
    ],
    validateRequest,
    async (req, res, next) => {
        try {
            const { apiaryId } = req.params;
            const userId = req.user.id;
            const options = {
                includeHives: req.query.include_hives === 'true',
                includeStats: req.query.include_stats === 'true'
            };

            const apiary = await apiaryService.getApiary(apiaryId, userId, options);

            res.json({
                success: true,
                data: apiary
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * Update apiary
 * PUT /api/apiaries/:apiaryId
 */
router.put('/:apiaryId',
    [
        param('apiaryId').isUUID().withMessage('معرف المنحل غير صحيح'),
        body('name').optional().isLength({ min: 1, max: 100 }).withMessage('اسم المنحل يجب أن يكون أقل من 100 حرف'),
        body('type').optional().isIn(['fixed', 'mobile']).withMessage('نوع المنحل يجب أن يكون ثابت أو متنقل'),
        body('location.latitude').optional().isFloat({ min: -90, max: 90 }).withMessage('خط العرض غير صحيح'),
        body('location.longitude').optional().isFloat({ min: -180, max: 180 }).withMessage('خط الطول غير صحيح'),
        body('location.address').optional().isString().withMessage('العنوان يجب أن يكون نص'),
        body('area').optional().isFloat({ min: 0 }).withMessage('المساحة يجب أن تكون رقم موجب'),
        body('capacity').optional().isInt({ min: 1 }).withMessage('السعة يجب أن تكون رقم صحيح موجب'),
        body('description').optional().isString().withMessage('الوصف يجب أن يكون نص')
    ],
    validateRequest,
    async (req, res, next) => {
        try {
            const { apiaryId } = req.params;
            const userId = req.user.id;
            const updateData = req.body;

            const apiary = await apiaryService.updateApiary(apiaryId, userId, updateData);

            res.json({
                success: true,
                message: 'تم تحديث المنحل بنجاح',
                data: apiary
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * Delete apiary
 * DELETE /api/apiaries/:apiaryId
 */
router.delete('/:apiaryId',
    [
        param('apiaryId').isUUID().withMessage('معرف المنحل غير صحيح')
    ],
    validateRequest,
    async (req, res, next) => {
        try {
            const { apiaryId } = req.params;
            const userId = req.user.id;

            await apiaryService.deleteApiary(apiaryId, userId);

            res.json({
                success: true,
                message: 'تم حذف المنحل بنجاح'
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * Get apiary statistics
 * GET /api/apiaries/:apiaryId/statistics
 */
router.get('/:apiaryId/statistics',
    [
        param('apiaryId').isUUID().withMessage('معرف المنحل غير صحيح')
    ],
    validateRequest,
    async (req, res, next) => {
        try {
            const { apiaryId } = req.params;
            const userId = req.user.id;

            const statistics = await apiaryService.getApiaryStatistics(apiaryId, userId);

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
 * Get apiary health report
 * GET /api/apiaries/:apiaryId/health-report
 */
router.get('/:apiaryId/health-report',
    [
        param('apiaryId').isUUID().withMessage('معرف المنحل غير صحيح')
    ],
    validateRequest,
    async (req, res, next) => {
        try {
            const { apiaryId } = req.params;
            const userId = req.user.id;

            const healthReport = await apiaryService.getApiaryHealthReport(apiaryId, userId);

            res.json({
                success: true,
                data: healthReport
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * Get apiary recommendations
 * GET /api/apiaries/:apiaryId/recommendations
 */
router.get('/:apiaryId/recommendations',
    [
        param('apiaryId').isUUID().withMessage('معرف المنحل غير صحيح')
    ],
    validateRequest,
    async (req, res, next) => {
        try {
            const { apiaryId } = req.params;
            const userId = req.user.id;

            const recommendations = await apiaryService.getApiaryRecommendations(apiaryId, userId);

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
 * Get nearby apiaries
 * GET /api/apiaries/nearby
 */
router.get('/nearby',
    [
        query('latitude').isFloat({ min: -90, max: 90 }).withMessage('خط العرض مطلوب وغير صحيح'),
        query('longitude').isFloat({ min: -180, max: 180 }).withMessage('خط الطول مطلوب وغير صحيح'),
        query('radius').optional().isFloat({ min: 0.1, max: 100 }).withMessage('نصف القطر يجب أن يكون بين 0.1 و 100 كم')
    ],
    validateRequest,
    async (req, res, next) => {
        try {
            const userId = req.user.id;
            const location = {
                latitude: parseFloat(req.query.latitude),
                longitude: parseFloat(req.query.longitude)
            };
            const radiusKm = parseFloat(req.query.radius) || 10;

            const nearbyApiaries = await apiaryService.getNearbyApiaries(userId, location, radiusKm);

            res.json({
                success: true,
                data: {
                    apiaries: nearbyApiaries,
                    count: nearbyApiaries.length,
                    search_radius_km: radiusKm
                }
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * Update mobile apiary location
 * POST /api/apiaries/:apiaryId/update-location
 */
router.post('/:apiaryId/update-location',
    [
        param('apiaryId').isUUID().withMessage('معرف المنحل غير صحيح'),
        body('latitude').isFloat({ min: -90, max: 90 }).withMessage('خط العرض غير صحيح'),
        body('longitude').isFloat({ min: -180, max: 180 }).withMessage('خط الطول غير صحيح'),
        body('address').optional().isString().withMessage('العنوان يجب أن يكون نص'),
        body('notes').optional().isString().withMessage('الملاحظات يجب أن تكون نص')
    ],
    validateRequest,
    async (req, res, next) => {
        try {
            const { apiaryId } = req.params;
            const userId = req.user.id;
            const locationData = req.body;

            // Check if apiary is mobile
            const apiary = await apiaryService.getApiary(apiaryId, userId);
            if (apiary.type !== 'mobile') {
                throw new AppError('يمكن تحديث الموقع للمناحل المتنقلة فقط', 400, 'NOT_MOBILE_APIARY');
            }

            const updatedApiary = await apiaryService.updateApiary(apiaryId, userId, {
                location: {
                    latitude: locationData.latitude,
                    longitude: locationData.longitude,
                    address: locationData.address || apiary.location.address
                },
                notes: locationData.notes ?
                    `${apiary.notes || ''}\n[${new Date().toISOString()}] تم تحديث الموقع: ${locationData.notes}` :
                    apiary.notes
            });

            res.json({
                success: true,
                message: 'تم تحديث موقع المنحل بنجاح',
                data: {
                    apiary_id: updatedApiary.id,
                    new_location: updatedApiary.location,
                    updated_at: updatedApiary.updatedAt
                }
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * Get location history for mobile apiary
 * GET /api/apiaries/:apiaryId/location-history
 */
router.get('/:apiaryId/location-history',
    [
        param('apiaryId').isUUID().withMessage('معرف المنحل غير صحيح'),
        query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('الحد الأقصى يجب أن يكون بين 1 و 100')
    ],
    validateRequest,
    async (req, res, next) => {
        try {
            const { apiaryId } = req.params;
            const userId = req.user.id;
            const limit = parseInt(req.query.limit) || 20;

            const apiary = await apiaryService.getApiary(apiaryId, userId);

            if (apiary.type !== 'mobile') {
                throw new AppError('تاريخ المواقع متاح للمناحل المتنقلة فقط', 400, 'NOT_MOBILE_APIARY');
            }

            const locationHistory = (apiary.location_history || []).slice(-limit);

            res.json({
                success: true,
                data: {
                    apiary_id: apiaryId,
                    current_location: apiary.location,
                    location_history: locationHistory,
                    total_moves: locationHistory.length
                }
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * Get user's apiary summary
 * GET /api/apiaries/summary
 */
router.get('/summary',
    async (req, res, next) => {
        try {
            const userId = req.user.id;

            const apiaries = await apiaryService.getUserApiaries(userId, { includeStats: true });

            const summary = {
                total_apiaries: apiaries.length,
                fixed_apiaries: apiaries.filter(a => a.type === 'fixed').length,
                mobile_apiaries: apiaries.filter(a => a.type === 'mobile').length,
                total_hives: 0,
                active_hives: 0,
                total_capacity: 0,
                capacity_utilization: 0,
                recent_activity: {
                    new_apiaries_this_month: 0,
                    recent_inspections: 0
                }
            };

            const currentMonth = new Date().getMonth();
            const currentYear = new Date().getFullYear();

            apiaries.forEach(apiary => {
                if (apiary.hives) {
                    summary.total_hives += apiary.hives.length;
                    summary.active_hives += apiary.hives.filter(h => h.status === 'active').length;
                }

                if (apiary.capacity) {
                    summary.total_capacity += apiary.capacity;
                }

                // Check if created this month
                const createdDate = new Date(apiary.createdAt);
                if (createdDate.getMonth() === currentMonth && createdDate.getFullYear() === currentYear) {
                    summary.recent_activity.new_apiaries_this_month++;
                }
            });

            // Calculate capacity utilization
            if (summary.total_capacity > 0) {
                summary.capacity_utilization = Math.round((summary.total_hives / summary.total_capacity) * 100);
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

module.exports = router;