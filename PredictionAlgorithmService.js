const logger = require('../utils/logger');

class PredictionAlgorithmService {
    /**
     * Predict swarming probability based on inspection data and historical patterns
     * @param {Object} inspectionData - Current inspection data
     * @param {Object} hive - Hive object with history
     * @param {Object} context - Environmental and seasonal context
     * @returns {Object}
     */
    predictSwarmingRisk(inspectionData, hive, context = {}) {
        let swarmingScore = 0;
        const factors = [];
        const timeframe = this.getCurrentTimeframe();

        // Population strength factor (0-25 points)
        if (inspectionData.population_strength === 'very_strong') {
            swarmingScore += 25;
            factors.push({ factor: 'طائفة قوية جداً', impact: 25, description: 'الطوائف القوية أكثر ميلاً للتطريد' });
        } else if (inspectionData.population_strength === 'strong') {
            swarmingScore += 15;
            factors.push({ factor: 'طائفة قوية', impact: 15, description: 'قوة جيدة قد تؤدي للتطريد' });
        }

        // Space constraints (0-20 points)
        const spaceScore = this.assessSpaceConstraints(hive, inspectionData);
        swarmingScore += spaceScore.score;
        if (spaceScore.score > 0) {
            factors.push({ factor: 'ضيق المساحة', impact: spaceScore.score, description: spaceScore.description });
        }

        // Queen age and quality (0-15 points)
        const queenScore = this.assessQueenSwarmingRisk(inspectionData, hive);
        swarmingScore += queenScore.score;
        if (queenScore.score > 0) {
            factors.push({ factor: 'عمر الملكة', impact: queenScore.score, description: queenScore.description });
        }

        // Seasonal factors (0-15 points)
        const seasonalScore = this.getSeasonalSwarmingRisk(timeframe.month, context.location);
        swarmingScore += seasonalScore.score;
        factors.push({ factor: 'العوامل الموسمية', impact: seasonalScore.score, description: seasonalScore.description });

        // Brood pattern indicators (0-10 points)
        if (inspectionData.brood_pattern === 'excellent' && inspectionData.population_strength === 'very_strong') {
            swarmingScore += 10;
            factors.push({ factor: 'نمط حضنة ممتاز', impact: 10, description: 'حضنة قوية مع طائفة كبيرة' });
        }

        // Historical swarming pattern (0-15 points)
        const historicalScore = this.analyzeHistoricalSwarmingPattern(hive);
        swarmingScore += historicalScore.score;
        if (historicalScore.score > 0) {
            factors.push({ factor: 'التاريخ السابق', impact: historicalScore.score, description: historicalScore.description });
        }

        // Calculate probability and risk level
        const probability = Math.min(100, swarmingScore);
        const riskLevel = this.getSwarmingRiskLevel(probability);
        const timeToSwarming = this.estimateTimeToSwarming(probability, factors);

        return {
            probability_percentage: probability,
            risk_level: riskLevel,
            contributing_factors: factors,
            estimated_timeframe: timeToSwarming,
            prevention_measures: this.getSwarmingPreventionMeasures(probability, factors),
            monitoring_schedule: this.getSwarmingMonitoringSchedule(riskLevel),
            confidence_level: this.calculateSwarmingConfidence(factors, inspectionData)
        };
    }

    /**
     * Forecast honey production based on current state and historical data
     * @param {Object} inspectionData - Current inspection data
     * @param {Object} hive - Hive object with history
     * @param {Object} context - Environmental context
     * @returns {Object}
     */
    forecastHoneyProduction(inspectionData, hive, context = {}) {
        const baseProduction = this.calculateBaseProduction(hive, context);
        const adjustmentFactors = this.getProductionAdjustmentFactors(inspectionData, hive, context);

        const forecast = {
            current_season: this.forecastCurrentSeason(baseProduction, adjustmentFactors, context),
            next_harvest: this.forecastNextHarvest(baseProduction, adjustmentFactors, context),
            annual_projection: this.forecastAnnualProduction(baseProduction, adjustmentFactors, context),
            factors_analysis: adjustmentFactors,
            confidence_intervals: this.calculateProductionConfidenceIntervals(baseProduction, adjustmentFactors)
        };

        return forecast;
    }

    /**
     * Predict health trajectory based on current indicators
     * @param {Object} inspectionData - Current inspection data
     * @param {Object} hive - Hive object with history
     * @returns {Object}
     */
    predictHealthTrajectory(inspectionData, hive) {
        const currentHealth = this.assessCurrentHealthState(inspectionData);
        const healthTrends = this.analyzeHealthTrends(hive.inspections || []);
        const riskFactors = this.identifyHealthRiskFactors(inspectionData, hive);

        const trajectory = {
            current_state: currentHealth,
            short_term_forecast: this.forecastShortTermHealth(currentHealth, healthTrends, riskFactors),
            medium_term_forecast: this.forecastMediumTermHealth(currentHealth, healthTrends, riskFactors),
            critical_thresholds: this.identifyCriticalHealthThresholds(currentHealth, riskFactors),
            intervention_points: this.calculateOptimalInterventionPoints(currentHealth, riskFactors),
            recovery_scenarios: this.generateHealthRecoveryScenarios(currentHealth, riskFactors)
        };

        return trajectory;
    }

    /**
     * Optimize intervention timing based on predictions
     * @param {Object} inspectionData - Current inspection data
     * @param {Object} hive - Hive object
     * @returns {Object}
     */
    optimizeInterventionTiming(inspectionData, hive) {
        const interventions = [];

        // Feeding interventions
        const feedingTiming = this.optimizeFeedingTiming(inspectionData, hive);
        if (feedingTiming.recommended) {
            interventions.push(feedingTiming);
        }

        // Treatment interventions
        const treatmentTiming = this.optimizeTreatmentTiming(inspectionData, hive);
        if (treatmentTiming.recommended) {
            interventions.push(treatmentTiming);
        }

        // Space management interventions
        const spaceTiming = this.optimizeSpaceManagementTiming(inspectionData, hive);
        if (spaceTiming.recommended) {
            interventions.push(spaceTiming);
        }

        // Queen management interventions
        const queenTiming = this.optimizeQueenManagementTiming(inspectionData, hive);
        if (queenTiming.recommended) {
            interventions.push(queenTiming);
        }

        return {
            recommended_interventions: interventions.sort((a, b) => a.priority - b.priority),
            optimal_sequence: this.calculateOptimalInterventionSequence(interventions),
            timing_windows: this.identifyOptimalTimingWindows(interventions),
            resource_requirements: this.calculateResourceRequirements(interventions)
        };
    }

    /**
     * Plan resource needs based on predictions
     * @param {Object} inspectionData - Current inspection data
     * @param {Object} hive - Hive object
     * @returns {Object}
     */
    planResourceNeeds(inspectionData, hive) {
        const timeHorizons = ['immediate', 'short_term', 'medium_term', 'long_term'];
        const resourcePlan = {};

        timeHorizons.forEach(horizon => {
            resourcePlan[horizon] = {
                equipment: this.predictEquipmentNeeds(inspectionData, hive, horizon),
                materials: this.predictMaterialNeeds(inspectionData, hive, horizon),
                treatments: this.predictTreatmentNeeds(inspectionData, hive, horizon),
                labor: this.predictLaborNeeds(inspectionData, hive, horizon),
                costs: this.estimateCosts(inspectionData, hive, horizon)
            };
        });

        return {
            resource_plan: resourcePlan,
            priority_items: this.identifyPriorityResources(resourcePlan),
            budget_forecast: this.forecastBudgetRequirements(resourcePlan),
            procurement_schedule: this.generateProcurementSchedule(resourcePlan)
        };
    }

    // Helper methods for swarming prediction

    assessSpaceConstraints(hive, inspectionData) {
        // Analyze available space vs population
        const frameCount = hive.specifications?.frame_count || 10;
        const populationStrength = inspectionData.population_strength;

        let score = 0;
        let description = '';

        if (populationStrength === 'very_strong' && frameCount < 15) {
            score = 20;
            description = 'مساحة محدودة مع طائفة قوية جداً';
        } else if (populationStrength === 'strong' && frameCount < 12) {
            score = 15;
            description = 'مساحة قد تكون غير كافية';
        } else if (populationStrength === 'very_strong' && frameCount < 20) {
            score = 10;
            description = 'مساحة مقبولة لكن قد تحتاج توسع';
        }

        return { score, description };
    }

    assessQueenSwarmingRisk(inspectionData, hive) {
        let score = 0;
        let description = '';

        const queenAge = hive.colony?.queen_age || 0;

        if (queenAge > 24) { // More than 2 years
            score = 15;
            description = 'ملكة كبيرة السن (أكثر من سنتين)';
        } else if (queenAge > 12) { // More than 1 year
            score = 8;
            description = 'ملكة متوسطة العمر';
        }

        // Adjust based on laying performance
        if (inspectionData.queen_laying === 'poor') {
            score += 5;
            description += ' مع ضعف في وضع البيض';
        }

        return { score, description };
    }

    getSeasonalSwarmingRisk(month, location) {
        // Swarming season varies by location, but generally spring/early summer
        const swarmingSeasons = {
            1: { score: 2, description: 'موسم شتوي - تطريد نادر' },
            2: { score: 3, description: 'أواخر الشتاء - تطريد نادر' },
            3: { score: 8, description: 'بداية الربيع - زيادة احتمال التطريد' },
            4: { score: 15, description: 'ذروة موسم التطريد الربيعي' },
            5: { score: 12, description: 'موسم تطريد نشط' },
            6: { score: 8, description: 'أواخر موسم التطريد' },
            7: { score: 4, description: 'صيف - تطريد أقل' },
            8: { score: 3, description: 'أواخر الصيف - تطريد نادر' },
            9: { score: 2, description: 'خريف - تطريد نادر' },
            10: { score: 1, description: 'خريف متأخر - تطريد نادر جداً' },
            11: { score: 1, description: 'بداية الشتاء - تطريد نادر جداً' },
            12: { score: 1, description: 'شتاء - تطريد نادر جداً' }
        };

        return swarmingSeasons[month] || swarmingSeasons[4];
    }

    analyzeHistoricalSwarmingPattern(hive) {
        // Analyze historical swarming events
        const inspections = hive.inspections || [];
        let score = 0;
        let description = '';

        // Look for patterns in historical data
        const swarmingIndicators = inspections.filter(inspection => {
            return inspection.notes &&
                (inspection.notes.includes('تطريد') ||
                    inspection.notes.includes('خلايا ملكية') ||
                    inspection.notes.includes('استعداد للتطريد'));
        });

        if (swarmingIndicators.length > 0) {
            score = Math.min(15, swarmingIndicators.length * 5);
            description = `تاريخ سابق للتطريد (${swarmingIndicators.length} مرة)`;
        }

        return { score, description };
    }

    getSwarmingRiskLevel(probability) {
        if (probability >= 70) return 'critical';
        if (probability >= 50) return 'high';
        if (probability >= 30) return 'medium';
        return 'low';
    }

    estimateTimeToSwarming(probability, factors) {
        if (probability < 30) return 'غير محتمل في المستقبل القريب';
        if (probability < 50) return '4-6 أسابيع';
        if (probability < 70) return '2-4 أسابيع';
        return '1-2 أسبوع';
    }

    getSwarmingPreventionMeasures(probability, factors) {
        const measures = [];

        if (probability >= 50) {
            measures.push('إضافة عسلات فورية لتوسيع المساحة');
            measures.push('فحص وإزالة خلايا الملكات');
            measures.push('تقسيم الطائفة إذا لزم الأمر');
        }

        if (probability >= 30) {
            measures.push('مراقبة يومية لخلايا الملكات');
            measures.push('تحسين التهوية');
            measures.push('تقليل الازدحام في منطقة الحضنة');
        }

        return measures;
    }

    getSwarmingMonitoringSchedule(riskLevel) {
        const schedules = {
            critical: 'فحص يومي',
            high: 'فحص كل يومين',
            medium: 'فحص أسبوعي',
            low: 'فحص شهري'
        };

        return schedules[riskLevel] || schedules.medium;
    }

    calculateSwarmingConfidence(factors, inspectionData) {
        let confidence = 70; // Base confidence

        // Increase confidence with more data points
        if (inspectionData.population_details) confidence += 10;
        if (inspectionData.brood_details) confidence += 10;
        if (factors.length >= 3) confidence += 10;

        return Math.min(100, confidence);
    }

    // Helper methods for production forecasting

    calculateBaseProduction(hive, context) {
        // Base production calculation based on hive type, location, etc.
        const hiveTypeProduction = {
            'langstroth': 25, // kg per year average
            'top_bar': 15,
            'warre': 20,
            'بلدي': 12,
            'أمريكي': 25,
            'كيني': 18
        };

        return hiveTypeProduction[hive.type] || 20;
    }

    getProductionAdjustmentFactors(inspectionData, hive, context) {
        const factors = [];

        // Population strength factor
        const populationMultipliers = {
            'very_strong': 1.3,
            'strong': 1.1,
            'moderate': 1.0,
            'weak': 0.7,
            'very_weak': 0.4
        };

        const populationFactor = populationMultipliers[inspectionData.population_strength] || 1.0;
        factors.push({
            factor: 'قوة الطائفة',
            multiplier: populationFactor,
            impact: (populationFactor - 1) * 100
        });

        // Queen performance factor
        let queenFactor = 1.0;
        if (inspectionData.queen_laying === 'yes') queenFactor = 1.1;
        else if (inspectionData.queen_laying === 'poor') queenFactor = 0.8;
        else if (inspectionData.queen_laying === 'no') queenFactor = 0.3;

        factors.push({
            factor: 'أداء الملكة',
            multiplier: queenFactor,
            impact: (queenFactor - 1) * 100
        });

        // Health factor
        const diseases = inspectionData.diseases_found || [];
        const pests = inspectionData.pests_found || [];
        const healthFactor = Math.max(0.5, 1 - (diseases.length * 0.1) - (pests.length * 0.05));

        factors.push({
            factor: 'الحالة الصحية',
            multiplier: healthFactor,
            impact: (healthFactor - 1) * 100
        });

        return factors;
    }

    getCurrentTimeframe() {
        const now = new Date();
        return {
            month: now.getMonth() + 1,
            season: this.getCurrentSeason(now.getMonth() + 1),
            year: now.getFullYear()
        };
    }

    getCurrentSeason(month) {
        if (month >= 3 && month <= 5) return 'spring';
        if (month >= 6 && month <= 8) return 'summer';
        if (month >= 9 && month <= 11) return 'autumn';
        return 'winter';
    }

    // Additional helper methods would be implemented here for complete functionality
    forecastCurrentSeason(baseProduction, factors, context) {
        // Implementation for current season forecast
        return {};
    }

    forecastNextHarvest(baseProduction, factors, context) {
        // Implementation for next harvest forecast
        return {};
    }

    forecastAnnualProduction(baseProduction, factors, context) {
        // Implementation for annual production forecast
        return {};
    }

    calculateProductionConfidenceIntervals(baseProduction, factors) {
        // Implementation for confidence intervals
        return {};
    }

    // ... other helper methods
}

module.exports = PredictionAlgorithmService;