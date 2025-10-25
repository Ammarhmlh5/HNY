const express = require('express');
const router = express.Router();
const { body, param, validationResult } = require('express-validator');
const InspectionService = require('../services/InspectionService');
const IntelligentInspectionService = require('../services/IntelligentInspectionService');
const auth = require('../middleware/auth');

// Get all inspections for a user
router.get('/', auth, async (req, res) => {
    try {
        const { page = 1, limit = 10, hive_id, apiary_id, type } = req.query;

        const filters = {
            user_id: req.user.id
        };

        if (hive_id) filters.hive_id = hive_id;
        if (apiary_id) filters.apiary_id = apiary_id;
        if (type) filters.inspection_type = type;

        const inspections = await InspectionService.getInspections(filters, {
            page: parseInt(page),
            limit: parseInt(limit)
        });

        res.json({
            success: true,
            data: inspections
        });
    } catch (error) {
        console.error('Error fetching inspections:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في جلب الفحوصات'
        });
    }
});

// Get inspection by ID
router.get('/:id', auth, async (req, res) => {
    try {
        const inspection = await InspectionService.getInspectionById(req.params.id, req.user.id);

        if (!inspection) {
            return res.status(404).json({
                success: false,
                message: 'الفحص غير موجود'
            });
        }

        res.json({
            success: true,
            data: inspection
        });
    } catch (error) {
        console.error('Error fetching inspection:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في جلب الفحص'
        });
    }
});

// Create new inspection
router.post('/', [
    auth,
    body('hive_id').isInt().withMessage('معرف الخلية مطلوب'),
    body('inspection_type').isIn(['routine', 'detailed', 'emergency', 'harvest']).withMessage('نوع الفحص غير صحيح'),
    body('queen_present').optional().isIn(['yes', 'no', 'not_seen', 'unknown']),
    body('queen_laying').optional().isIn(['yes', 'no', 'poor', 'unknown']),
    body('brood_pattern').optional().isIn(['excellent', 'good', 'fair', 'poor', 'none']),
    body('population_strength').optional().isIn(['very_strong', 'strong', 'moderate', 'weak', 'very_weak']),
    body('food_stores').optional().isIn(['abundant', 'adequate', 'low', 'critical', 'none']),
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

        const inspectionData = {
            ...req.body,
            user_id: req.user.id,
            inspection_date: new Date()
        };

        const inspection = await InspectionService.createInspection(inspectionData);

        // Run intelligent analysis
        const analysis = await IntelligentInspectionService.analyzeInspection(inspection.id);

        res.status(201).json({
            success: true,
            data: {
                ...inspection,
                analysis
            }
        });
    } catch (error) {
        console.error('Error creating inspection:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في إنشاء الفحص'
        });
    }
});

// Quick inspection endpoint
router.post('/hive/:hiveId/quick', [
    auth,
    param('hiveId').isInt().withMessage('معرف الخلية مطلوب'),
    body('queen_present').isIn(['yes', 'no', 'not_seen', 'unknown']).withMessage('حالة الملكة مطلوبة'),
    body('queen_laying').isIn(['yes', 'no', 'poor', 'unknown']).withMessage('حالة وضع البيض مطلوبة'),
    body('brood_pattern').isIn(['excellent', 'good', 'fair', 'poor', 'none']).withMessage('نمط الحضنة مطلوب'),
    body('population_strength').isIn(['very_strong', 'strong', 'moderate', 'weak', 'very_weak']).withMessage('قوة الطائفة مطلوبة'),
    body('food_stores').isIn(['abundant', 'adequate', 'low', 'critical', 'none']).withMessage('مخزون الغذاء مطلوب'),
    body('notes').optional().isString().isLength({ max: 1000 }),
    body('photos').optional().isArray(),
    body('audio_notes').optional().isArray(),
    body('field_mode').optional().isBoolean(),
    body('duration_minutes').optional().isInt({ min: 1, max: 60 })
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

        const hiveId = req.params.hiveId;

        // Verify hive ownership
        const hive = await InspectionService.getHiveById(hiveId, req.user.id);
        if (!hive) {
            return res.status(404).json({
                success: false,
                message: 'الخلية غير موجودة'
            });
        }

        // Calculate quick score
        const quickScore = calculateQuickInspectionScore(req.body);

        const inspectionData = {
            hive_id: parseInt(hiveId),
            user_id: req.user.id,
            inspection_type: 'routine',
            inspection_date: new Date(),
            duration_minutes: req.body.duration_minutes || 5,
            queen_present: req.body.queen_present,
            queen_laying: req.body.queen_laying,
            brood_pattern: req.body.brood_pattern,
            population_strength: req.body.population_strength,
            food_stores: req.body.food_stores,
            notes: req.body.notes || '',
            photos: req.body.photos || [],
            audio_notes: req.body.audio_notes || [],
            field_mode: req.body.field_mode || false,
            quick_score: quickScore.score,
            status: quickScore.status
        };

        const inspection = await InspectionService.createInspection(inspectionData);

        // Generate quick recommendations
        const recommendations = generateQuickRecommendations(req.body, quickScore);

        // Run intelligent analysis for detailed insights
        const analysis = await IntelligentInspectionService.analyzeInspection(inspection.id);

        res.status(201).json({
            success: true,
            data: {
                inspection_id: inspection.id,
                summary: {
                    score: quickScore.score,
                    status: quickScore.status,
                    timestamp: inspection.inspection_date
                },
                recommendations: recommendations,
                analysis: analysis,
                next_inspection_date: calculateNextInspectionDate(quickScore.status)
            }
        });
    } catch (error) {
        console.error('Error creating quick inspection:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في إنشاء الفحص السريع'
        });
    }
});

// Update inspection
router.put('/:id', [
    auth,
    param('id').isInt().withMessage('معرف الفحص مطلوب'),
    body('queen_present').optional().isIn(['yes', 'no', 'not_seen', 'unknown']),
    body('queen_laying').optional().isIn(['yes', 'no', 'poor', 'unknown']),
    body('brood_pattern').optional().isIn(['excellent', 'good', 'fair', 'poor', 'none']),
    body('population_strength').optional().isIn(['very_strong', 'strong', 'moderate', 'weak', 'very_weak']),
    body('food_stores').optional().isIn(['abundant', 'adequate', 'low', 'critical', 'none']),
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

        const inspection = await InspectionService.updateInspection(
            req.params.id,
            req.body,
            req.user.id
        );

        if (!inspection) {
            return res.status(404).json({
                success: false,
                message: 'الفحص غير موجود'
            });
        }

        res.json({
            success: true,
            data: inspection
        });
    } catch (error) {
        console.error('Error updating inspection:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في تحديث الفحص'
        });
    }
});

// Delete inspection
router.delete('/:id', auth, async (req, res) => {
    try {
        const deleted = await InspectionService.deleteInspection(req.params.id, req.user.id);

        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: 'الفحص غير موجود'
            });
        }

        res.json({
            success: true,
            message: 'تم حذف الفحص بنجاح'
        });
    } catch (error) {
        console.error('Error deleting inspection:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في حذف الفحص'
        });
    }
});

// Get inspection statistics
router.get('/stats/summary', auth, async (req, res) => {
    try {
        const { apiary_id, hive_id, period = '30' } = req.query;

        const stats = await InspectionService.getInspectionStats(req.user.id, {
            apiary_id,
            hive_id,
            days: parseInt(period)
        });

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Error fetching inspection stats:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في جلب إحصائيات الفحوصات'
        });
    }
});

// Helper function to calculate quick inspection score
function calculateQuickInspectionScore(data) {
    const weights = {
        queen_present: 25,
        queen_laying: 25,
        brood_pattern: 20,
        population_strength: 15,
        food_stores: 15
    };

    const scores = {
        queen_present: {
            yes: 100,
            not_seen: 70,
            no: 0,
            unknown: 50
        },
        queen_laying: {
            yes: 100,
            poor: 50,
            no: 0,
            unknown: 50
        },
        brood_pattern: {
            excellent: 100,
            good: 80,
            fair: 60,
            poor: 30,
            none: 0
        },
        population_strength: {
            very_strong: 100,
            strong: 80,
            moderate: 60,
            weak: 30,
            very_weak: 10
        },
        food_stores: {
            abundant: 100,
            adequate: 80,
            low: 40,
            critical: 10,
            none: 0
        }
    };

    let totalScore = 0;
    let totalWeight = 0;

    Object.keys(weights).forEach(key => {
        if (data[key]) {
            const weight = weights[key];
            const score = scores[key][data[key]] || 0;

            totalScore += (score * weight) / 100;
            totalWeight += weight;
        }
    });

    const finalScore = totalWeight > 0 ? Math.round(totalScore / totalWeight * 100) : 0;

    let status;
    if (finalScore >= 80) status = 'green';
    else if (finalScore >= 60) status = 'yellow';
    else if (finalScore >= 40) status = 'orange';
    else status = 'red';

    return { score: finalScore, status };
}

// Helper function to generate quick recommendations
function generateQuickRecommendations(data, scoreData) {
    const recommendations = [];

    // Queen-related recommendations
    if (data.queen_present === 'no') {
        recommendations.push('الخلية بدون ملكة - يجب إدخال ملكة جديدة فوراً');
    } else if (data.queen_present === 'not_seen' && data.queen_laying === 'no') {
        recommendations.push('لا توجد علامات على وجود ملكة نشطة - فحص دقيق مطلوب');
    }

    if (data.queen_laying === 'poor') {
        recommendations.push('وضع البيض ضعيف - قد تحتاج الملكة للاستبدال');
    } else if (data.queen_laying === 'no') {
        recommendations.push('الملكة لا تبيض - فحص عاجل لحالة الملكة');
    }

    // Brood pattern recommendations
    if (data.brood_pattern === 'poor') {
        recommendations.push('نمط الحضنة ضعيف - قد يشير لمشاكل في الملكة أو المرض');
    } else if (data.brood_pattern === 'none') {
        recommendations.push('لا توجد حضنة - مشكلة خطيرة تحتاج تدخل فوري');
    }

    // Population recommendations
    if (data.population_strength === 'weak' || data.population_strength === 'very_weak') {
        recommendations.push('الطائفة ضعيفة - تحتاج تقوية أو دمج مع طائفة أخرى');
    }

    // Food recommendations
    if (data.food_stores === 'critical' || data.food_stores === 'none') {
        recommendations.push('مخزون الغذاء منخفض جداً - تغذية فورية مطلوبة');
    } else if (data.food_stores === 'low') {
        recommendations.push('مخزون الغذاء قليل - ابدأ برنامج تغذية');
    }

    // Overall status recommendations
    if (scoreData.status === 'red') {
        recommendations.push('حالة الخلية حرجة - تدخل عاجل مطلوب');
    } else if (scoreData.status === 'orange') {
        recommendations.push('الخلية تحتاج انتباه - فحص تفصيلي خلال أسبوع');
    } else if (scoreData.status === 'yellow') {
        recommendations.push('حالة الخلية جيدة مع بعض النقاط للتحسين');
    } else {
        recommendations.push('حالة الخلية ممتازة - استمر في الرعاية الحالية');
    }

    return recommendations.slice(0, 5); // Return top 5 recommendations
}

// Helper function to calculate next inspection date
function calculateNextInspectionDate(status) {
    const now = new Date();
    let daysToAdd;

    switch (status) {
        case 'red':
            daysToAdd = 3; // 3 days for critical status
            break;
        case 'orange':
            daysToAdd = 7; // 1 week for needs attention
            break;
        case 'yellow':
            daysToAdd = 14; // 2 weeks for good status
            break;
        case 'green':
            daysToAdd = 21; // 3 weeks for excellent status
            break;
        default:
            daysToAdd = 14;
    }

    const nextDate = new Date(now);
    nextDate.setDate(now.getDate() + daysToAdd);
    return nextDate.toISOString();
}

module.exports = router;