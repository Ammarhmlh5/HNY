const { Inspection, Hive, Apiary, Frame } = require('../models');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

class IntelligentInspectionService {
    /**
     * Analyze inspection data and provide intelligent insights
     * @param {Object} inspectionData - Raw inspection data
     * @param {string} hiveId - Hive ID
     * @param {string} userId - User ID
     * @returns {Promise<Object>}
     */
    async analyzeInspection(inspectionData, hiveId, userId) {
        // Get hive with historical data
        const hive = await Hive.findOne({
            where: { id: hiveId },
            include: [{
                model: Apiary,
                as: 'apiary',
                where: { owner_id: userId }
            }, {
                model: Inspection,
                as: 'inspections',
                limit: 10,
                order: [['inspection_date', 'DESC']]
            }]
        });

        if (!hive) {
            throw new AppError('الخلية غير موجودة', 404, 'HIVE_NOT_FOUND');
        }

        const analysis = {
            basic_assessment: this.calculateBasicAssessment(inspectionData),
            risk_analysis: this.analyzeRisks(inspectionData, hive),
            trend_analysis: this.analyzeTrends(inspectionData, hive.inspections || []),
            predictive_insights: await this.generatePredictiveInsights(inspectionData, hive),
            recommendations: this.generateIntelligentRecommendations(inspectionData, hive),
            alerts: this.generateAlerts(inspectionData, hive),
            seasonal_context: this.getSeasonalContext(inspectionData),
            comparative_analysis: await this.performComparativeAnalysis(inspectionData, hive)
        };

        return analysis;
    }

    /**
     * Calculate basic assessment scores
     * @param {Object} inspectionData - Inspection data
     * @returns {Object}
     */
    calculateBasicAssessment(inspectionData) {
        const scores = {
            queen_score: 0,
            brood_score: 0,
            population_score: 0,
            food_score: 0,
            health_score: 0,
            total_score: 0
        };

        // Queen assessment (25 points)
        if (inspectionData.queen_present === 'yes') {
            scores.queen_score += 15;
            if (inspectionData.queen_laying === 'yes') {
                scores.queen_score += 10;
            } else if (inspectionData.queen_laying === 'poor') {
                scores.queen_score += 5;
            }
        } else if (inspectionData.queen_present === 'not_seen') {
            scores.queen_score += 8;
        }

        // Brood assessment (25 points)
        const broodScores = {
            'excellent': 25,
            'good': 20,
            'fair': 15,
            'poor': 8,
            'none': 0
        };
        scores.brood_score = broodScores[inspectionData.brood_pattern] || 0;

        // Population assessment (20 points)
        const populationScores = {
            'very_strong': 20,
            'strong': 16,
            'moderate': 12,
            'weak': 6,
            'very_weak': 2
        };
        scores.population_score = populationScores[inspectionData.population_strength] || 0;

        // Food assessment (15 points)
        const foodScores = {
            'abundant': 15,
            'adequate': 12,
            'low': 6,
            'critical': 2,
            'none': 0
        };
        scores.food_score = foodScores[inspectionData.food_stores] || 0;

        // Health deductions
        scores.health_score = 15;
        const diseases = inspectionData.diseases_found || [];
        const pests = inspectionData.pests_found || [];

        scores.health_score -= Math.min(diseases.length * 3, 10);
        scores.health_score -= Math.min(pests.length * 2, 5);
        scores.health_score = Math.max(0, scores.health_score);

        // Calculate total
        scores.total_score = scores.queen_score + scores.brood_score +
            scores.population_score + scores.food_score + scores.health_score;

        return {
            scores,
            grade: this.calculateGrade(scores.total_score),
            confidence_level: this.calculateConfidenceLevel(inspectionData)
        };
    }

    /**
     * Analyze risks based on inspection data
     * @param {Object} inspectionData - Inspection data
     * @param {Object} hive - Hive object
     * @returns {Object}
     */
    analyzeRisks(inspectionData, hive) {
        const risks = [];
        let overallRiskLevel = 'low';

        // Queen-related risks
        if (inspectionData.queen_present === 'no') {
            risks.push({
                type: 'queen_loss',
                level: 'critical',
                probability: 100,
                impact: 'high',
                description: 'فقدان الملكة - خطر موت الطائفة',
                timeframe: 'immediate',
                mitigation: ['إدخال ملكة جديدة فوراً', 'دمج مع طائفة أخرى']
            });
            overallRiskLevel = 'critical';
        } else if (inspectionData.queen_laying === 'no' || inspectionData.queen_laying === 'poor') {
            risks.push({
                type: 'queen_failure',
                level: 'high',
                probability: 80,
                impact: 'high',
                description: 'ضعف أو توقف وضع البيض',
                timeframe: 'short_term',
                mitigation: ['مراقبة مكثفة', 'تحضير ملكة بديلة', 'تحسين التغذية']
            });
            overallRiskLevel = 'high';
        }

        // Population risks
        if (inspectionData.population_strength === 'very_weak' || inspectionData.population_strength === 'weak') {
            risks.push({
                type: 'population_decline',
                level: 'high',
                probability: 70,
                impact: 'medium',
                description: 'ضعف شديد في قوة الطائفة',
                timeframe: 'short_term',
                mitigation: ['تقوية بحضنة مغلقة', 'تحسين التغذية', 'حماية من البرد']
            });
            if (overallRiskLevel === 'low') overallRiskLevel = 'medium';
        }

        // Food security risks
        if (inspectionData.food_stores === 'critical' || inspectionData.food_stores === 'none') {
            risks.push({
                type: 'starvation',
                level: 'critical',
                probability: 90,
                impact: 'high',
                description: 'خطر موت الطائفة جوعاً',
                timeframe: 'immediate',
                mitigation: ['تغذية طارئة فورية', 'مراقبة يومية']
            });
            overallRiskLevel = 'critical';
        } else if (inspectionData.food_stores === 'low') {
            risks.push({
                type: 'food_shortage',
                level: 'medium',
                probability: 60,
                impact: 'medium',
                description: 'نقص في مخزون الغذاء',
                timeframe: 'short_term',
                mitigation: ['بدء التغذية التكميلية', 'مراقبة أسبوعية']
            });
            if (overallRiskLevel === 'low') overallRiskLevel = 'medium';
        }

        // Disease and pest risks
        const diseases = inspectionData.diseases_found || [];
        const pests = inspectionData.pests_found || [];

        if (diseases.length > 0 || pests.length > 0) {
            risks.push({
                type: 'health_issues',
                level: diseases.length > 2 || pests.length > 2 ? 'high' : 'medium',
                probability: 75,
                impact: 'medium',
                description: `مشاكل صحية: ${[...diseases, ...pests].join(', ')}`,
                timeframe: 'short_term',
                mitigation: ['بدء العلاج المناسب', 'عزل إذا لزم الأمر', 'تحسين النظافة']
            });
            if (overallRiskLevel === 'low') overallRiskLevel = 'medium';
        }

        // Seasonal risks
        const seasonalRisks = this.assessSeasonalRisks(inspectionData);
        risks.push(...seasonalRisks);

        return {
            overall_risk_level: overallRiskLevel,
            risk_score: this.calculateRiskScore(risks),
            identified_risks: risks,
            risk_matrix: this.createRiskMatrix(risks),
            monitoring_schedule: this.generateMonitoringSchedule(risks)
        };
    }

    /**
     * Analyze trends from historical data
     * @param {Object} currentInspection - Current inspection data
     * @param {Array} historicalInspections - Historical inspections
     * @returns {Object}
     */
    analyzeTrends(currentInspection, historicalInspections) {
        if (historicalInspections.length === 0) {
            return {
                trend_available: false,
                message: 'لا توجد بيانات تاريخية كافية لتحليل الاتجاهات'
            };
        }

        const trends = {
            health_trend: this.analyzeHealthTrend(currentInspection, historicalInspections),
            population_trend: this.analyzePopulationTrend(currentInspection, historicalInspections),
            productivity_trend: this.analyzeProductivityTrend(currentInspection, historicalInspections),
            seasonal_patterns: this.identifySeasonalPatterns(historicalInspections),
            anomaly_detection: this.detectAnomalies(currentInspection, historicalInspections)
        };

        return {
            trend_available: true,
            ...trends,
            trend_summary: this.generateTrendSummary(trends),
            forecast: this.generateShortTermForecast(trends)
        };
    }

    /**
     * Generate predictive insights
     * @param {Object} inspectionData - Current inspection data
     * @param {Object} hive - Hive object with history
     * @returns {Promise<Object>}
     */
    async generatePredictiveInsights(inspectionData, hive) {
        const insights = {
            swarming_prediction: this.predictSwarmingRisk(inspectionData, hive),
            production_forecast: this.forecastProduction(inspectionData, hive),
            health_trajectory: this.predictHealthTrajectory(inspectionData, hive),
            intervention_timing: this.optimizeInterventionTiming(inspectionData, hive),
            resource_planning: this.planResourceNeeds(inspectionData, hive)
        };

        return insights;
    }

    /**
     * Generate intelligent recommendations
     * @param {Object} inspectionData - Inspection data
     * @param {Object} hive - Hive object
     * @returns {Array}
     */
    generateIntelligentRecommendations(inspectionData, hive) {
        const recommendations = [];

        // Priority-based recommendations
        const priorities = this.calculateRecommendationPriorities(inspectionData, hive);

        priorities.forEach(priority => {
            switch (priority.type) {
                case 'queen_management':
                    recommendations.push(...this.getQueenManagementRecommendations(inspectionData, priority.urgency));
                    break;
                case 'population_management':
                    recommendations.push(...this.getPopulationManagementRecommendations(inspectionData, priority.urgency));
                    break;
                case 'feeding':
                    recommendations.push(...this.getFeedingRecommendations(inspectionData, priority.urgency));
                    break;
                case 'health_treatment':
                    recommendations.push(...this.getHealthTreatmentRecommendations(inspectionData, priority.urgency));
                    break;
                case 'space_management':
                    recommendations.push(...this.getSpaceManagementRecommendations(inspectionData, hive, priority.urgency));
                    break;
            }
        });

        // Add contextual recommendations
        recommendations.push(...this.getContextualRecommendations(inspectionData, hive));

        return this.prioritizeAndFilterRecommendations(recommendations);
    }

    /**
     * Generate alerts based on inspection
     * @param {Object} inspectionData - Inspection data
     * @param {Object} hive - Hive object
     * @returns {Array}
     */
    generateAlerts(inspectionData, hive) {
        const alerts = [];

        // Critical alerts
        if (inspectionData.queen_present === 'no') {
            alerts.push({
                level: 'critical',
                type: 'queen_loss',
                title: 'فقدان الملكة',
                message: 'الخلية بدون ملكة - تدخل فوري مطلوب',
                action_required: true,
                timeline: 'خلال 24 ساعة'
            });
        }

        if (inspectionData.food_stores === 'none' || inspectionData.food_stores === 'critical') {
            alerts.push({
                level: 'critical',
                type: 'starvation_risk',
                title: 'خطر الموت جوعاً',
                message: 'مخزون الغذاء منتهي أو شبه منتهي',
                action_required: true,
                timeline: 'فوراً'
            });
        }

        // High priority alerts
        if (inspectionData.population_strength === 'very_weak') {
            alerts.push({
                level: 'high',
                type: 'weak_colony',
                title: 'طائفة ضعيفة جداً',
                message: 'قوة الطائفة ضعيفة جداً وتحتاج تدخل',
                action_required: true,
                timeline: 'خلال 48 ساعة'
            });
        }

        // Disease alerts
        const diseases = inspectionData.diseases_found || [];
        if (diseases.length > 0) {
            alerts.push({
                level: diseases.length > 2 ? 'high' : 'medium',
                type: 'disease_detected',
                title: 'أمراض مكتشفة',
                message: `تم اكتشاف: ${diseases.join(', ')}`,
                action_required: true,
                timeline: 'خلال أسبوع'
            });
        }

        // Seasonal alerts
        alerts.push(...this.generateSeasonalAlerts(inspectionData));

        return alerts.sort((a, b) => {
            const levelPriority = { critical: 3, high: 2, medium: 1, low: 0 };
            return levelPriority[b.level] - levelPriority[a.level];
        });
    }

    /**
     * Get seasonal context for inspection
     * @param {Object} inspectionData - Inspection data
     * @returns {Object}
     */
    getSeasonalContext(inspectionData) {
        const currentMonth = new Date().getMonth() + 1;
        const season = this.getCurrentSeason(currentMonth);

        return {
            current_season: season,
            seasonal_expectations: this.getSeasonalExpectations(season),
            seasonal_adjustments: this.getSeasonalAdjustments(inspectionData, season),
            optimal_activities: this.getOptimalSeasonalActivities(season),
            weather_considerations: this.getWeatherConsiderations(season)
        };
    }

    /**
     * Perform comparative analysis
     * @param {Object} inspectionData - Current inspection data
     * @param {Object} hive - Hive object
     * @returns {Promise<Object>}
     */
    async performComparativeAnalysis(inspectionData, hive) {
        // Get similar hives for comparison
        const similarHives = await this.findSimilarHives(hive);

        return {
            apiary_comparison: await this.compareWithApiaryAverage(inspectionData, hive.apiary_id),
            regional_comparison: await this.compareWithRegionalData(inspectionData, hive.apiary.location),
            seasonal_comparison: await this.compareWithSeasonalNorms(inspectionData),
            performance_percentile: await this.calculatePerformancePercentile(inspectionData, similarHives),
            improvement_potential: this.calculateImprovementPotential(inspectionData, similarHives)
        };
    }

    // Helper methods for calculations and analysis

    calculateGrade(score) {
        if (score >= 90) return 'A+';
        if (score >= 85) return 'A';
        if (score >= 80) return 'B+';
        if (score >= 75) return 'B';
        if (score >= 70) return 'C+';
        if (score >= 65) return 'C';
        if (score >= 60) return 'D+';
        if (score >= 55) return 'D';
        return 'F';
    }

    calculateConfidenceLevel(inspectionData) {
        let confidence = 100;

        // Reduce confidence for missing data
        const requiredFields = ['queen_present', 'queen_laying', 'brood_pattern', 'population_strength', 'food_stores'];
        const missingFields = requiredFields.filter(field => !inspectionData[field] || inspectionData[field] === 'unknown');

        confidence -= missingFields.length * 15;

        // Reduce confidence for uncertain observations
        const uncertainFields = requiredFields.filter(field => inspectionData[field] === 'not_seen' || inspectionData[field] === 'unknown');
        confidence -= uncertainFields.length * 10;

        return Math.max(50, confidence);
    }

    calculateRiskScore(risks) {
        const weights = { critical: 10, high: 7, medium: 4, low: 1 };
        return risks.reduce((score, risk) => score + (weights[risk.level] || 0), 0);
    }

    createRiskMatrix(risks) {
        const matrix = {
            critical: { immediate: [], short_term: [], medium_term: [], long_term: [] },
            high: { immediate: [], short_term: [], medium_term: [], long_term: [] },
            medium: { immediate: [], short_term: [], medium_term: [], long_term: [] },
            low: { immediate: [], short_term: [], medium_term: [], long_term: [] }
        };

        risks.forEach(risk => {
            if (matrix[risk.level] && matrix[risk.level][risk.timeframe]) {
                matrix[risk.level][risk.timeframe].push(risk);
            }
        });

        return matrix;
    }

    generateMonitoringSchedule(risks) {
        const schedule = [];

        risks.forEach(risk => {
            switch (risk.timeframe) {
                case 'immediate':
                    schedule.push({
                        task: `مراقبة ${risk.description}`,
                        frequency: 'يومي',
                        duration: '1-3 أيام'
                    });
                    break;
                case 'short_term':
                    schedule.push({
                        task: `متابعة ${risk.description}`,
                        frequency: 'كل 3 أيام',
                        duration: '1-2 أسبوع'
                    });
                    break;
                case 'medium_term':
                    schedule.push({
                        task: `فحص ${risk.description}`,
                        frequency: 'أسبوعي',
                        duration: '1 شهر'
                    });
                    break;
            }
        });

        return schedule;
    }

    getCurrentSeason(month) {
        if (month >= 3 && month <= 5) return 'spring';
        if (month >= 6 && month <= 8) return 'summer';
        if (month >= 9 && month <= 11) return 'autumn';
        return 'winter';
    }

    getSeasonalExpectations(season) {
        const expectations = {
            spring: {
                population: 'نمو سريع',
                brood: 'زيادة كبيرة في الحضنة',
                food_consumption: 'استهلاك عالي',
                activity: 'نشاط مكثف'
            },
            summer: {
                population: 'ذروة القوة',
                brood: 'حضنة كثيفة',
                food_consumption: 'استهلاك متوسط',
                activity: 'إنتاج العسل'
            },
            autumn: {
                population: 'تراجع تدريجي',
                brood: 'تقليل الحضنة',
                food_consumption: 'تخزين للشتاء',
                activity: 'تحضير للشتاء'
            },
            winter: {
                population: 'أقل مستوى',
                brood: 'حضنة قليلة أو معدومة',
                food_consumption: 'استهلاك المخزون',
                activity: 'حد أدنى من النشاط'
            }
        };

        return expectations[season] || expectations.winter;
    }

    // Additional helper methods would be implemented here...
    // This is a comprehensive foundation for the intelligent inspection system

    async findSimilarHives(hive) {
        // Implementation for finding similar hives for comparison
        return [];
    }

    async compareWithApiaryAverage(inspectionData, apiaryId) {
        // Implementation for apiary comparison
        return {};
    }

    async compareWithRegionalData(inspectionData, location) {
        // Implementation for regional comparison
        return {};
    }

    // ... other helper methods
}

module.exports = IntelligentInspectionService;