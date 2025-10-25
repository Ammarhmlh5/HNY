const { Inspection, Hive, Apiary, User, Frame } = require('../models');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');
const IntelligentInspectionService = require('./IntelligentInspectionService');
const ScoreCalculatorService = require('./ScoreCalculatorService');
const PredictionAlgorithmService = require('./PredictionAlgorithmService');

class InspectionService {
    constructor() {
        this.intelligentService = new IntelligentInspectionService();
        this.scoreCalculator = new ScoreCalculatorService();
        this.predictionService = new PredictionAlgorithmService();
    }
    /**
     * Create new inspection
     * @param {string} hiveId - Hive ID
     * @param {string} userId - Inspector user ID
     * @param {Object} inspectionData - Inspection data
     * @returns {Promise<Inspection>}
     */
    async createInspection(hiveId, userId, inspectionData) {
        // Verify user owns the hive
        const hive = await Hive.findOne({
            where: { id: hiveId },
            include: [{
                model: Apiary,
                as: 'apiary',
                where: { owner_id: userId }
            }]
        });

        if (!hive) {
            throw new AppError('الخلية غير موجودة', 404, 'HIVE_NOT_FOUND');
        }

        // Create inspection
        const inspection = await Inspection.create({
            hive_id: hiveId,
            inspector_id: userId,
            ...inspectionData
        });

        // Perform intelligent analysis
        const intelligentAnalysis = await this.performIntelligentAnalysis(inspection, hive);

        // Update inspection with intelligent insights
        await inspection.update({
            auto_score: intelligentAnalysis.score_analysis.weighted_score,
            overall_status: intelligentAnalysis.score_analysis.color_code,
            risk_level: intelligentAnalysis.risk_analysis.overall_risk_level,
            recommendations: intelligentAnalysis.recommendations.map(r => r.action || r.message),
            next_inspection_date: intelligentAnalysis.next_inspection_date
        });

        // Update hive status based on inspection
        await this.updateHiveStatusFromInspection(hive, inspection);

        logger.info(`Created inspection ${inspection.id} for hive ${hiveId} with intelligent analysis`);
        return { inspection, analysis: intelligentAnalysis };
    }

    /**
     * Quick inspection with 5 basic questions
     * @param {string} hiveId - Hive ID
     * @param {string} userId - Inspector user ID
     * @param {Object} quickData - Quick inspection data
     * @returns {Promise<Inspection>}
     */
    async createQuickInspection(hiveId, userId, quickData) {
        const inspectionData = {
            inspection_type: 'routine',
            queen_present: quickData.queen_present,
            queen_laying: quickData.queen_laying,
            brood_pattern: quickData.brood_pattern,
            population_strength: quickData.population_strength,
            food_stores: quickData.food_stores,
            notes: quickData.notes || '',
            photos: quickData.photos || [],
            audio_notes: quickData.audio_notes || []
        };

        return await this.createInspection(hiveId, userId, inspectionData);
    }

    /**
     * Get inspection by ID
     * @param {string} inspectionId - Inspection ID
     * @param {string} userId - User ID
     * @returns {Promise<Inspection>}
     */
    async getInspection(inspectionId, userId) {
        const inspection = await Inspection.findOne({
            where: { id: inspectionId },
            include: [{
                model: Hive,
                as: 'hive',
                include: [{
                    model: Apiary,
                    as: 'apiary',
                    where: { owner_id: userId }
                }]
            }, {
                model: User,
                as: 'inspector',
                attributes: ['id', 'name', 'email']
            }]
        });

        if (!inspection) {
            throw new AppError('الفحص غير موجود', 404, 'INSPECTION_NOT_FOUND');
        }

        return inspection;
    }

    /**
     * Update inspection
     * @param {string} inspectionId - Inspection ID
     * @param {string} userId - User ID
     * @param {Object} updateData - Update data
     * @returns {Promise<Inspection>}
     */
    async updateInspection(inspectionId, userId, updateData) {
        const inspection = await this.getInspection(inspectionId, userId);

        await inspection.update(updateData);

        // Update hive status if critical fields changed
        const criticalFields = ['queen_present', 'queen_laying', 'brood_pattern', 'population_strength', 'food_stores'];
        const hasCriticalChanges = criticalFields.some(field => updateData.hasOwnProperty(field));

        if (hasCriticalChanges) {
            await this.updateHiveStatusFromInspection(inspection.hive, inspection);
        }

        logger.info(`Updated inspection ${inspectionId}`);
        return inspection;
    }

    /**
     * Get hive inspection history
     * @param {string} hiveId - Hive ID
     * @param {string} userId - User ID
     * @param {Object} options - Query options
     * @returns {Promise<Array>}
     */
    async getHiveInspectionHistory(hiveId, userId, options = {}) {
        // Verify user owns the hive
        const hive = await Hive.findOne({
            where: { id: hiveId },
            include: [{
                model: Apiary,
                as: 'apiary',
                where: { owner_id: userId }
            }]
        });

        if (!hive) {
            throw new AppError('الخلية غير موجودة', 404, 'HIVE_NOT_FOUND');
        }

        const { limit = 20, offset = 0, type = null } = options;
        const whereClause = { hive_id: hiveId };

        if (type) {
            whereClause.inspection_type = type;
        }

        const inspections = await Inspection.findAll({
            where: whereClause,
            order: [['inspection_date', 'DESC']],
            limit,
            offset,
            include: [{
                model: User,
                as: 'inspector',
                attributes: ['id', 'name']
            }]
        });

        return inspections;
    }

    /**
     * Get inspection analytics for hive
     * @param {string} hiveId - Hive ID
     * @param {string} userId - User ID
     * @param {Object} options - Analytics options
     * @returns {Promise<Object>}
     */
    async getHiveInspectionAnalytics(hiveId, userId, options = {}) {
        const { days = 90 } = options;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        // Verify user owns the hive
        const hive = await Hive.findOne({
            where: { id: hiveId },
            include: [{
                model: Apiary,
                as: 'apiary',
                where: { owner_id: userId }
            }]
        });

        if (!hive) {
            throw new AppError('الخلية غير موجودة', 404, 'HIVE_NOT_FOUND');
        }

        const inspections = await Inspection.findAll({
            where: {
                hive_id: hiveId,
                inspection_date: {
                    [Inspection.sequelize.Sequelize.Op.gte]: startDate
                }
            },
            order: [['inspection_date', 'ASC']]
        });

        if (inspections.length === 0) {
            return {
                hive_id: hiveId,
                period_days: days,
                total_inspections: 0,
                message: 'لا توجد فحوصات في هذه الفترة'
            };
        }

        // Calculate analytics
        const analytics = {
            hive_id: hiveId,
            period_days: days,
            total_inspections: inspections.length,

            // Score trends
            score_trend: inspections.map(i => ({
                date: i.inspection_date,
                score: i.auto_score,
                status: i.overall_status
            })),

            // Average scores
            average_score: this.calculateAverage(inspections.map(i => i.auto_score).filter(s => s !== null)),

            // Status distribution
            status_distribution: this.calculateDistribution(inspections, 'overall_status'),

            // Risk level distribution
            risk_distribution: this.calculateDistribution(inspections, 'risk_level'),

            // Queen status trends
            queen_trends: {
                present: this.calculateDistribution(inspections, 'queen_present'),
                laying: this.calculateDistribution(inspections, 'queen_laying')
            },

            // Population trends
            population_trends: this.calculateDistribution(inspections, 'population_strength'),

            // Food store trends
            food_trends: this.calculateDistribution(inspections, 'food_stores'),

            // Health issues
            health_issues: {
                diseases: this.getHealthIssueFrequency(inspections, 'diseases_found'),
                pests: this.getHealthIssueFrequency(inspections, 'pests_found')
            },

            // Latest inspection summary
            latest_inspection: inspections[inspections.length - 1]?.getInspectionSummary(),

            // Recommendations based on trends
            recommendations: this.generateTrendRecommendations(inspections)
        };

        return analytics;
    }

    /**
     * Get overdue inspections for user
     * @param {string} userId - User ID
     * @returns {Promise<Array>}
     */
    async getOverdueInspections(userId) {
        const today = new Date();

        // Get all hives owned by user
        const hives = await Hive.findAll({
            include: [{
                model: Apiary,
                as: 'apiary',
                where: { owner_id: userId }
            }]
        });

        const hiveIds = hives.map(h => h.id);

        // Get latest inspection for each hive
        const overdueInspections = [];

        for (const hiveId of hiveIds) {
            const latestInspection = await Inspection.findOne({
                where: { hive_id: hiveId },
                order: [['inspection_date', 'DESC']]
            });

            if (latestInspection && latestInspection.next_inspection_date < today) {
                const hive = hives.find(h => h.id === hiveId);
                overdueInspections.push({
                    hive: {
                        id: hive.id,
                        name: hive.name,
                        apiary_name: hive.apiary.name
                    },
                    last_inspection: latestInspection.inspection_date,
                    due_date: latestInspection.next_inspection_date,
                    days_overdue: Math.floor((today - latestInspection.next_inspection_date) / (1000 * 60 * 60 * 24)),
                    risk_level: latestInspection.risk_level,
                    status: latestInspection.overall_status
                });
            }
        }

        // Sort by days overdue (most overdue first)
        return overdueInspections.sort((a, b) => b.days_overdue - a.days_overdue);
    }

    /**
     * Get inspection dashboard for user
     * @param {string} userId - User ID
     * @returns {Promise<Object>}
     */
    async getInspectionDashboard(userId) {
        const today = new Date();
        const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        const lastMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

        // Get user's hives
        const hives = await Hive.findAll({
            include: [{
                model: Apiary,
                as: 'apiary',
                where: { owner_id: userId }
            }]
        });

        const hiveIds = hives.map(h => h.id);

        // Get recent inspections
        const recentInspections = await Inspection.findAll({
            where: {
                hive_id: { [Inspection.sequelize.Sequelize.Op.in]: hiveIds },
                inspection_date: { [Inspection.sequelize.Sequelize.Op.gte]: lastMonth }
            },
            order: [['inspection_date', 'DESC']],
            include: [{
                model: Hive,
                as: 'hive',
                attributes: ['id', 'name']
            }]
        });

        // Calculate statistics
        const dashboard = {
            total_hives: hives.length,

            // Inspection counts
            inspections_this_week: recentInspections.filter(i => i.inspection_date >= lastWeek).length,
            inspections_this_month: recentInspections.length,

            // Status overview
            hive_status_overview: await this.getHiveStatusOverview(hiveIds),

            // Overdue inspections
            overdue_inspections: await this.getOverdueInspections(userId),

            // Recent inspections
            recent_inspections: recentInspections.slice(0, 10).map(i => ({
                id: i.id,
                hive_name: i.hive.name,
                date: i.inspection_date,
                status: i.overall_status,
                score: i.auto_score,
                risk_level: i.risk_level
            })),

            // Alerts and recommendations
            alerts: await this.generateDashboardAlerts(hiveIds),

            // Quick stats
            quick_stats: {
                healthy_hives: 0,
                attention_needed: 0,
                critical_hives: 0
            }
        };

        // Calculate quick stats
        const statusCounts = dashboard.hive_status_overview;
        dashboard.quick_stats = {
            healthy_hives: (statusCounts.green || 0) + (statusCounts.yellow || 0),
            attention_needed: statusCounts.orange || 0,
            critical_hives: statusCounts.red || 0
        };

        return dashboard;
    }

    /**
     * Generate inspection report
     * @param {string} inspectionId - Inspection ID
     * @param {string} userId - User ID
     * @returns {Promise<Object>}
     */
    async generateInspectionReport(inspectionId, userId) {
        const inspection = await this.getInspection(inspectionId, userId);

        const report = {
            inspection_info: {
                id: inspection.id,
                date: inspection.inspection_date,
                type: inspection.inspection_type,
                duration: inspection.duration_minutes,
                weather: inspection.weather_conditions,
                inspector: inspection.inspector.name
            },

            hive_info: {
                name: inspection.hive.name,
                apiary: inspection.hive.apiary.name,
                type: inspection.hive.type
            },

            assessment: inspection.getInspectionSummary(),

            detailed_findings: {
                queen_details: inspection.queen_details,
                brood_details: inspection.brood_details,
                population_details: inspection.population_details,
                food_details: inspection.food_details
            },

            health_status: {
                diseases: inspection.diseases_found,
                pests: inspection.pests_found,
                health_score: inspection.health_score
            },

            actions_and_recommendations: {
                actions_taken: inspection.actions_taken,
                recommendations: inspection.recommendations,
                next_inspection: inspection.next_inspection_date
            },

            media: {
                photos: inspection.photos,
                audio_notes: inspection.audio_notes
            },

            notes: inspection.notes
        };

        return report;
    }

    // Helper methods
    async updateHiveStatusFromInspection(hive, inspection) {
        // Update hive's last inspection date and status
        const updateData = {
            last_inspection: inspection.inspection_date,
            health_status: inspection.overall_status
        };

        // Update status based on inspection results
        if (inspection.overall_status === 'red' || inspection.risk_level === 'critical') {
            updateData.status = 'needs_attention';
        } else if (inspection.overall_status === 'orange') {
            updateData.status = 'monitoring';
        } else if (inspection.overall_status === 'green') {
            updateData.status = 'active';
        }

        await hive.update(updateData);
    }

    calculateAverage(numbers) {
        if (numbers.length === 0) return null;
        return Math.round(numbers.reduce((sum, num) => sum + num, 0) / numbers.length);
    }

    calculateDistribution(items, field) {
        const distribution = {};
        items.forEach(item => {
            const value = item[field];
            if (value) {
                distribution[value] = (distribution[value] || 0) + 1;
            }
        });
        return distribution;
    }

    getHealthIssueFrequency(inspections, field) {
        const frequency = {};
        inspections.forEach(inspection => {
            const issues = inspection[field] || [];
            issues.forEach(issue => {
                frequency[issue] = (frequency[issue] || 0) + 1;
            });
        });
        return frequency;
    }

    generateTrendRecommendations(inspections) {
        const recommendations = [];

        if (inspections.length < 2) return recommendations;

        const recent = inspections.slice(-3); // Last 3 inspections

        // Check for declining scores
        const scores = recent.map(i => i.auto_score).filter(s => s !== null);
        if (scores.length >= 2) {
            const isDecline = scores[scores.length - 1] < scores[0] - 10;
            if (isDecline) {
                recommendations.push({
                    type: 'trend_alert',
                    priority: 'high',
                    message: 'انخفاض في نقاط التقييم خلال الفحوصات الأخيرة',
                    action: 'مراجعة شاملة لحالة الخلية'
                });
            }
        }

        // Check for recurring issues
        const allDiseases = recent.flatMap(i => i.diseases_found || []);
        const diseaseFreq = {};
        allDiseases.forEach(d => diseaseFreq[d] = (diseaseFreq[d] || 0) + 1);

        Object.entries(diseaseFreq).forEach(([disease, count]) => {
            if (count >= 2) {
                recommendations.push({
                    type: 'recurring_issue',
                    priority: 'medium',
                    message: `مرض متكرر: ${disease}`,
                    action: 'استشارة طبيب بيطري متخصص'
                });
            }
        });

        return recommendations;
    }

    async getHiveStatusOverview(hiveIds) {
        const latestInspections = await Promise.all(
            hiveIds.map(async hiveId => {
                return await Inspection.findOne({
                    where: { hive_id: hiveId },
                    order: [['inspection_date', 'DESC']]
                });
            })
        );

        const statusCounts = {};
        latestInspections.forEach(inspection => {
            if (inspection && inspection.overall_status) {
                const status = inspection.overall_status;
                statusCounts[status] = (statusCounts[status] || 0) + 1;
            }
        });

        return statusCounts;
    }

    async generateDashboardAlerts(hiveIds) {
        const alerts = [];

        // Check for critical hives
        const criticalInspections = await Inspection.findAll({
            where: {
                hive_id: { [Inspection.sequelize.Sequelize.Op.in]: hiveIds },
                overall_status: 'red'
            },
            order: [['inspection_date', 'DESC']],
            limit: 5,
            include: [{
                model: Hive,
                as: 'hive',
                attributes: ['id', 'name']
            }]
        });

        criticalInspections.forEach(inspection => {
            alerts.push({
                type: 'critical',
                hive_name: inspection.hive.name,
                message: 'خلية تحتاج تدخل فوري',
                date: inspection.inspection_date
            });
        });

        return alerts;
    }
}

module.exports = InspectionService;
    /**
 
    * Perform intelligent analysis on inspection
     * @param {Inspection} inspection - Inspection instance
     * @param {Hive} hive - Hive instance
     * @returns {Promise<Object>}
     */
    async performIntelligentAnalysis(inspection, hive) {
    try {
        // Prepare inspection data for analysis
        const inspectionData = {
            queen_present: inspection.queen_present,
            queen_laying: inspection.queen_laying,
            brood_pattern: inspection.brood_pattern,
            population_strength: inspection.population_strength,
            food_stores: inspection.food_stores,
            diseases_found: inspection.diseases_found,
            pests_found: inspection.pests_found,
            queen_details: inspection.queen_details,
            brood_details: inspection.brood_details,
            population_details: inspection.population_details,
            food_details: inspection.food_details,
            weather_conditions: inspection.weather_conditions,
            notes: inspection.notes
        };

        // Get seasonal context
        const currentMonth = new Date().getMonth() + 1;
        const season = this.getCurrentSeason(currentMonth);

        // Prepare context
        const context = {
            season,
            month: currentMonth,
            hive_age: hive.colony?.age || 0,
            queen_age: hive.colony?.queen_age || 0,
            location: hive.apiary?.location,
            history: hive.inspections?.map(i => i.auto_score).filter(s => s !== null) || []
        };

        // Perform comprehensive score calculation
        const scoreAnalysis = this.scoreCalculator.calculateComprehensiveScore(inspectionData, context);

        // Perform intelligent analysis
        const intelligentAnalysis = await this.intelligentService.analyzeInspection(inspectionData, hive.id, hive.apiary.owner_id);

        // Generate predictions
        const swarmingPrediction = this.predictionService.predictSwarmingRisk(inspectionData, hive, context);
        const productionForecast = this.predictionService.forecastHoneyProduction(inspectionData, hive, context);
        const healthTrajectory = this.predictionService.predictHealthTrajectory(inspectionData, hive);
        const interventionTiming = this.predictionService.optimizeInterventionTiming(inspectionData, hive);

        // Calculate next inspection date
        const nextInspectionDate = this.calculateNextInspectionDate(scoreAnalysis, intelligentAnalysis.risk_analysis);

        return {
            score_analysis: scoreAnalysis,
            risk_analysis: intelligentAnalysis.risk_analysis,
            trend_analysis: intelligentAnalysis.trend_analysis,
            predictions: {
                swarming: swarmingPrediction,
                production: productionForecast,
                health_trajectory: healthTrajectory
            },
            recommendations: intelligentAnalysis.recommendations,
            alerts: intelligentAnalysis.alerts,
            seasonal_context: intelligentAnalysis.seasonal_context,
            intervention_timing: interventionTiming,
            next_inspection_date: nextInspectionDate,
            confidence_metrics: {
                overall_confidence: this.calculateOverallConfidence(scoreAnalysis, intelligentAnalysis),
                data_completeness: this.assessDataCompleteness(inspectionData),
                prediction_reliability: this.assessPredictionReliability(context.history)
            }
        };

    } catch (error) {
        logger.error('Error in intelligent analysis:', error);
        // Return basic analysis if intelligent analysis fails
        return this.getFallbackAnalysis(inspection);
    }
}

/**
 * Calculate next inspection date based on analysis
 * @param {Object} scoreAnalysis - Score analysis results
 * @param {Object} riskAnalysis - Risk analysis results
 * @returns {Date}
 */
calculateNextInspectionDate(scoreAnalysis, riskAnalysis) {
    const baseInterval = 14; // 2 weeks default
    let adjustedInterval = baseInterval;

    // Adjust based on overall score
    if (scoreAnalysis.weighted_score < 50) {
        adjustedInterval = 3; // 3 days for critical
    } else if (scoreAnalysis.weighted_score < 70) {
        adjustedInterval = 7; // 1 week for poor
    } else if (scoreAnalysis.weighted_score < 85) {
        adjustedInterval = 10; // 10 days for fair
    } else {
        adjustedInterval = 21; // 3 weeks for excellent
    }

    // Adjust based on risk level
    if (riskAnalysis.overall_risk_level === 'critical') {
        adjustedInterval = Math.min(adjustedInterval, 2);
    } else if (riskAnalysis.overall_risk_level === 'high') {
        adjustedInterval = Math.min(adjustedInterval, 5);
    }

    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + adjustedInterval);
    return nextDate;
}

/**
 * Calculate overall confidence in analysis
 * @param {Object} scoreAnalysis - Score analysis
 * @param {Object} intelligentAnalysis - Intelligent analysis
 * @returns {number}
 */
calculateOverallConfidence(scoreAnalysis, intelligentAnalysis) {
    let confidence = 70; // Base confidence

    // Increase confidence based on data quality
    if (scoreAnalysis.score_breakdown.queen_assessment.percentage > 80) confidence += 5;
    if (scoreAnalysis.score_breakdown.brood_assessment.percentage > 80) confidence += 5;
    if (scoreAnalysis.score_breakdown.population_assessment.percentage > 80) confidence += 5;

    // Adjust based on trend availability
    if (intelligentAnalysis.trend_analysis?.trend_available) confidence += 10;

    return Math.min(100, confidence);
}

/**
 * Assess data completeness
 * @param {Object} inspectionData - Inspection data
 * @returns {number}
 */
assessDataCompleteness(inspectionData) {
    const requiredFields = ['queen_present', 'queen_laying', 'brood_pattern', 'population_strength', 'food_stores'];
    const optionalFields = ['queen_details', 'brood_details', 'population_details', 'food_details'];

    const requiredComplete = requiredFields.filter(field => inspectionData[field] && inspectionData[field] !== 'unknown').length;
    const optionalComplete = optionalFields.filter(field => inspectionData[field] && Object.keys(inspectionData[field]).length > 0).length;

    const requiredScore = (requiredComplete / requiredFields.length) * 70;
    const optionalScore = (optionalComplete / optionalFields.length) * 30;

    return Math.round(requiredScore + optionalScore);
}

/**
 * Assess prediction reliability based on historical data
 * @param {Array} history - Historical scores
 * @returns {number}
 */
assessPredictionReliability(history) {
    if (history.length === 0) return 40;
    if (history.length < 3) return 60;
    if (history.length < 5) return 75;
    return 90;
}

/**
 * Get fallback analysis if intelligent analysis fails
 * @param {Inspection} inspection - Inspection instance
 * @returns {Object}
 */
getFallbackAnalysis(inspection) {
    return {
        score_analysis: { weighted_score: inspection.auto_score || 70, color_code: 'yellow' },
        risk_analysis: { overall_risk_level: 'medium' },
        recommendations: ['فحص دوري منتظم'],
        alerts: [],
        next_inspection_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 weeks
        confidence_metrics: { overall_confidence: 50, data_completeness: 60, prediction_reliability: 40 }
    };
}

/**
 * Get current season based on month
 * @param {number} month - Month number (1-12)
 * @returns {string}
 */
getCurrentSeason(month) {
    if (month >= 3 && month <= 5) return 'spring';
    if (month >= 6 && month <= 8) return 'summer';
    if (month >= 9 && month <= 11) return 'autumn';
    return 'winter';
}