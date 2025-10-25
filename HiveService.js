const { Hive, Apiary, User, Super, Frame, Inspection } = require('../models');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

class HiveService {
    /**
     * Create new hive
     * @param {string} apiaryId - Apiary ID
     * @param {string} userId - User ID
     * @param {Object} hiveData - Hive data
     * @returns {Promise<Hive>}
     */
    async createHive(apiaryId, userId, hiveData) {
        // Verify user owns the apiary
        const apiary = await Apiary.findOne({
            where: {
                id: apiaryId,
                owner_id: userId
            }
        });

        if (!apiary) {
            throw new AppError('المنحل غير موجود', 404, 'APIARY_NOT_FOUND');
        }

        // Check if position is available
        if (hiveData.position) {
            const existingHive = await Hive.findOne({
                where: {
                    apiary_id: apiaryId,
                    'position.row': hiveData.position.row,
                    'position.column': hiveData.position.column
                }
            });

            if (existingHive) {
                throw new AppError('هذا الموضع محجوز بالفعل', 400, 'POSITION_OCCUPIED');
            }
        }

        // Check apiary capacity
        const currentHiveCount = await Hive.count({ where: { apiary_id: apiaryId } });
        if (apiary.capacity && currentHiveCount >= apiary.capacity) {
            throw new AppError('المنحل وصل للسعة القصوى', 400, 'APIARY_AT_CAPACITY');
        }

        // Create hive
        const hive = await Hive.create({
            ...hiveData,
            apiary_id: apiaryId
        });

        logger.info(`Created hive ${hive.id} in apiary ${apiaryId}`);
        return hive;
    }

    /**
     * Get hive by ID
     * @param {string} hiveId - Hive ID
     * @param {string} userId - User ID
     * @param {Object} options - Query options
     * @returns {Promise<Hive>}
     */
    async getHive(hiveId, userId, options = {}) {
        const {
            includeSupers = false,
            includeFrames = false,
            includeInspections = false,
            inspectionLimit = 5
        } = options;

        const includeArray = [{
            model: Apiary,
            as: 'apiary',
            where: { owner_id: userId },
            attributes: ['id', 'name', 'type']
        }];

        if (includeSupers) {
            const superInclude = {
                model: Super,
                as: 'supers'
            };

            if (includeFrames) {
                superInclude.include = [{
                    model: Frame,
                    as: 'frames'
                }];
            }

            includeArray.push(superInclude);
        }

        if (includeFrames && !includeSupers) {
            includeArray.push({
                model: Frame,
                as: 'frames'
            });
        }

        if (includeInspections) {
            includeArray.push({
                model: Inspection,
                as: 'inspections',
                limit: inspectionLimit,
                order: [['inspection_date', 'DESC']]
            });
        }

        const hive = await Hive.findOne({
            where: { id: hiveId },
            include: includeArray
        });

        if (!hive) {
            throw new AppError('الخلية غير موجودة', 404, 'HIVE_NOT_FOUND');
        }

        return hive;
    }

    /**
     * Update hive
     * @param {string} hiveId - Hive ID
     * @param {string} userId - User ID
     * @param {Object} updateData - Update data
     * @returns {Promise<Hive>}
     */
    async updateHive(hiveId, userId, updateData) {
        const hive = await this.getHive(hiveId, userId);

        // Check position availability if position is being updated
        if (updateData.position) {
            const existingHive = await Hive.findOne({
                where: {
                    apiary_id: hive.apiary_id,
                    'position.row': updateData.position.row,
                    'position.column': updateData.position.column,
                    id: { [Hive.sequelize.Sequelize.Op.ne]: hiveId }
                }
            });

            if (existingHive) {
                throw new AppError('هذا الموضع محجوز بالفعل', 400, 'POSITION_OCCUPIED');
            }
        }

        await hive.update(updateData);

        logger.info(`Updated hive ${hiveId}`);
        return hive;
    }

    /**
     * Delete hive
     * @param {string} hiveId - Hive ID
     * @param {string} userId - User ID
     * @returns {Promise<void>}
     */
    async deleteHive(hiveId, userId) {
        const hive = await this.getHive(hiveId, userId, { includeSupers: true, includeFrames: true });

        // Check if hive has supers or frames
        if ((hive.supers && hive.supers.length > 0) || (hive.frames && hive.frames.length > 0)) {
            throw new AppError('لا يمكن حذف خلية تحتوي على عسلات أو إطارات', 400, 'HIVE_HAS_COMPONENTS');
        }

        await hive.destroy();
        logger.info(`Deleted hive ${hiveId}`);
    }

    /**
     * Get hive statistics
     * @param {string} hiveId - Hive ID
     * @param {string} userId - User ID
     * @returns {Promise<Object>}
     */
    async getHiveStatistics(hiveId, userId) {
        const hive = await this.getHive(hiveId, userId, {
            includeSupers: true,
            includeFrames: true,
            includeInspections: true,
            inspectionLimit: 10
        });

        const stats = {
            hive_info: {
                id: hive.id,
                name: hive.name,
                type: hive.type,
                status: hive.status,
                age_months: this.calculateHiveAge(hive.colony.age),
                queen_age_months: hive.colony.queen_age
            },

            // Structure statistics
            structure: {
                total_supers: hive.supers?.length || 0,
                total_frames: 0,
                brood_chamber_frames: 0,
                super_frames: 0,
                frame_distribution: {
                    brood: 0,
                    honey: 0,
                    pollen: 0,
                    empty: 0,
                    foundation: 0
                }
            },

            // Health and performance
            health: {
                current_status: hive.health_status,
                current_score: hive.health_score,
                last_inspection: hive.last_inspection,
                days_since_inspection: hive.last_inspection ?
                    Math.floor((new Date() - new Date(hive.last_inspection)) / (1000 * 60 * 60 * 24)) : null
            },

            // Production estimates
            production: {
                estimated_honey_kg: 0,
                productive_frames: 0,
                capacity_utilization: 0,
                seasonal_productivity: this.calculateSeasonalProductivity(hive)
            },

            // Inspection trends
            inspection_trends: {
                total_inspections: hive.inspections?.length || 0,
                recent_scores: [],
                health_trend: 'stable',
                issues_frequency: {}
            }
        };

        // Calculate frame statistics
        if (hive.frames && hive.frames.length > 0) {
            stats.structure.total_frames = hive.frames.length;

            hive.frames.forEach(frame => {
                if (frame.super_id) {
                    stats.structure.super_frames++;
                } else {
                    stats.structure.brood_chamber_frames++;
                }

                // Frame type distribution
                stats.structure.frame_distribution[frame.type]++;

                // Production calculations
                if (frame.type === 'honey' && frame.estimated_weight) {
                    stats.production.estimated_honey_kg += frame.estimated_weight;
                }

                if (['brood', 'honey', 'pollen'].includes(frame.type)) {
                    stats.production.productive_frames++;
                }
            });

            // Calculate capacity utilization
            const maxFrames = hive.specifications?.frame_count || 10;
            stats.production.capacity_utilization = Math.round(
                (stats.structure.total_frames / maxFrames) * 100
            );
        }

        // Analyze inspection trends
        if (hive.inspections && hive.inspections.length > 0) {
            const recentInspections = hive.inspections.slice(0, 5);
            stats.inspection_trends.recent_scores = recentInspections
                .filter(i => i.auto_score !== null)
                .map(i => ({
                    date: i.inspection_date,
                    score: i.auto_score,
                    status: i.overall_status
                }));

            // Calculate health trend
            if (stats.inspection_trends.recent_scores.length >= 2) {
                const scores = stats.inspection_trends.recent_scores.map(s => s.score);
                const firstScore = scores[scores.length - 1];
                const lastScore = scores[0];

                if (lastScore > firstScore + 10) {
                    stats.inspection_trends.health_trend = 'improving';
                } else if (lastScore < firstScore - 10) {
                    stats.inspection_trends.health_trend = 'declining';
                }
            }

            // Calculate issues frequency
            hive.inspections.forEach(inspection => {
                const diseases = inspection.diseases_found || [];
                const pests = inspection.pests_found || [];

                [...diseases, ...pests].forEach(issue => {
                    stats.inspection_trends.issues_frequency[issue] =
                        (stats.inspection_trends.issues_frequency[issue] || 0) + 1;
                });
            });
        }

        return stats;
    }

    /**
     * Get hive management recommendations
     * @param {string} hiveId - Hive ID
     * @param {string} userId - User ID
     * @returns {Promise<Object>}
     */
    async getHiveRecommendations(hiveId, userId) {
        const stats = await this.getHiveStatistics(hiveId, userId);
        const hive = await this.getHive(hiveId, userId, { includeInspections: true });

        const recommendations = {
            urgent_actions: [],
            management_suggestions: [],
            seasonal_advice: [],
            expansion_opportunities: [],
            health_monitoring: []
        };

        // Urgent actions based on status
        if (hive.status === 'queenless') {
            recommendations.urgent_actions.push({
                priority: 'critical',
                action: 'إدخال ملكة جديدة',
                description: 'الخلية بدون ملكة وتحتاج تدخل فوري',
                timeline: 'خلال 24-48 ساعة'
            });
        }

        if (hive.status === 'dead') {
            recommendations.urgent_actions.push({
                priority: 'high',
                action: 'فحص سبب الموت وتطهير الخلية',
                description: 'تحديد سبب موت الطائفة ومنع انتشار المشاكل',
                timeline: 'فوراً'
            });
        }

        // Health-based recommendations
        if (stats.health.current_status === 'critical') {
            recommendations.urgent_actions.push({
                priority: 'high',
                action: 'فحص طبي شامل',
                description: 'الحالة الصحية حرجة وتحتاج تقييم فوري',
                timeline: 'خلال 24 ساعة'
            });
        }

        // Inspection-based recommendations
        if (stats.health.days_since_inspection > 30) {
            recommendations.health_monitoring.push({
                type: 'inspection_overdue',
                action: 'فحص دوري',
                description: `لم يتم فحص الخلية منذ ${stats.health.days_since_inspection} يوم`,
                timeline: 'في أقرب وقت ممكن'
            });
        }

        // Capacity and expansion recommendations
        if (stats.production.capacity_utilization > 80) {
            recommendations.expansion_opportunities.push({
                type: 'add_super',
                action: 'إضافة عسلة جديدة',
                description: 'الخلية تستغل أكثر من 80% من السعة',
                benefits: ['منع التطريد', 'زيادة إنتاج العسل', 'توفير مساحة للتوسع']
            });
        }

        if (stats.production.capacity_utilization < 40) {
            recommendations.management_suggestions.push({
                type: 'consolidate',
                action: 'تقليل حجم الخلية',
                description: 'الخلية تستغل أقل من 40% من السعة',
                benefits: ['تحسين التدفئة', 'تقليل استهلاك الطاقة', 'حماية أفضل']
            });
        }

        // Production recommendations
        if (stats.production.estimated_honey_kg < 5 && stats.structure.total_frames > 15) {
            recommendations.management_suggestions.push({
                type: 'productivity',
                action: 'تحسين الإنتاجية',
                description: 'إنتاج العسل منخفض مقارنة بحجم الخلية',
                suggestions: [
                    'فحص جودة الملكة',
                    'تحسين التغذية',
                    'مراجعة ظروف الموقع',
                    'علاج الأمراض والآفات'
                ]
            });
        }

        // Trend-based recommendations
        if (stats.inspection_trends.health_trend === 'declining') {
            recommendations.health_monitoring.push({
                type: 'declining_health',
                action: 'مراقبة صحية مكثفة',
                description: 'اتجاه تنازلي في النقاط الصحية',
                timeline: 'فحوصات أسبوعية لمدة شهر'
            });
        }

        // Issue frequency recommendations
        Object.entries(stats.inspection_trends.issues_frequency).forEach(([issue, count]) => {
            if (count >= 3) {
                recommendations.health_monitoring.push({
                    type: 'recurring_issue',
                    action: `علاج متخصص لـ ${issue}`,
                    description: `مشكلة متكررة ظهرت ${count} مرات`,
                    timeline: 'استشارة طبيب بيطري'
                });
            }
        });

        // Seasonal recommendations
        const currentMonth = new Date().getMonth() + 1;
        recommendations.seasonal_advice = this.getSeasonalHiveAdvice(currentMonth, stats);

        return recommendations;
    }

    /**
     * Manage hive supers dynamically
     * @param {string} hiveId - Hive ID
     * @param {string} userId - User ID
     * @param {Object} options - Management options
     * @returns {Promise<Object>}
     */
    async manageHiveSupers(hiveId, userId, options = {}) {
        const { action, superData } = options;
        const hive = await this.getHive(hiveId, userId, { includeSupers: true, includeFrames: true });

        const result = {
            action_taken: action,
            hive_id: hiveId,
            before_state: {
                super_count: hive.supers?.length || 0,
                total_frames: hive.frames?.length || 0
            },
            after_state: {},
            recommendations: []
        };

        switch (action) {
            case 'add_super':
                const newSuper = await Super.create({
                    hive_id: hiveId,
                    type: superData.type || 'medium',
                    frame_count: superData.frame_count || 8,
                    position: (hive.supers?.length || 0) + 1,
                    purpose: superData.purpose || 'honey'
                });

                result.new_super_id = newSuper.id;
                result.recommendations.push('إضافة إطارات للعسلة الجديدة');
                break;

            case 'remove_super':
                if (!superData.super_id) {
                    throw new AppError('معرف العسلة مطلوب للحذف', 400, 'SUPER_ID_REQUIRED');
                }

                const superToRemove = await Super.findOne({
                    where: { id: superData.super_id, hive_id: hiveId },
                    include: [{ model: Frame, as: 'frames' }]
                });

                if (!superToRemove) {
                    throw new AppError('العسلة غير موجودة', 404, 'SUPER_NOT_FOUND');
                }

                if (superToRemove.frames && superToRemove.frames.length > 0) {
                    throw new AppError('لا يمكن حذف عسلة تحتوي على إطارات', 400, 'SUPER_HAS_FRAMES');
                }

                await superToRemove.destroy();
                result.removed_super_id = superData.super_id;
                break;

            case 'reorder_supers':
                if (!superData.new_order || !Array.isArray(superData.new_order)) {
                    throw new AppError('ترتيب العسلات الجديد مطلوب', 400, 'NEW_ORDER_REQUIRED');
                }

                for (let i = 0; i < superData.new_order.length; i++) {
                    await Super.update(
                        { position: i + 1 },
                        { where: { id: superData.new_order[i], hive_id: hiveId } }
                    );
                }

                result.new_order = superData.new_order;
                break;

            default:
                throw new AppError('إجراء غير صحيح', 400, 'INVALID_ACTION');
        }

        // Get updated state
        const updatedHive = await this.getHive(hiveId, userId, { includeSupers: true, includeFrames: true });
        result.after_state = {
            super_count: updatedHive.supers?.length || 0,
            total_frames: updatedHive.frames?.length || 0
        };

        logger.info(`Managed supers for hive ${hiveId}: ${action}`);
        return result;
    }

    /**
     * Calculate hive performance metrics
     * @param {string} hiveId - Hive ID
     * @param {string} userId - User ID
     * @param {Object} options - Calculation options
     * @returns {Promise<Object>}
     */
    async calculateHivePerformance(hiveId, userId, options = {}) {
        const { period = 'year' } = options;
        const hive = await this.getHive(hiveId, userId, { includeInspections: true });

        // Calculate date range
        const endDate = new Date();
        const startDate = new Date();

        switch (period) {
            case 'month':
                startDate.setMonth(endDate.getMonth() - 1);
                break;
            case 'quarter':
                startDate.setMonth(endDate.getMonth() - 3);
                break;
            case 'year':
                startDate.setFullYear(endDate.getFullYear() - 1);
                break;
        }

        // Filter inspections by period
        const periodInspections = hive.inspections?.filter(inspection =>
            new Date(inspection.inspection_date) >= startDate
        ) || [];

        const performance = {
            period,
            date_range: { start: startDate, end: endDate },
            hive_info: {
                id: hive.id,
                name: hive.name,
                type: hive.type
            },

            // Health performance
            health_metrics: {
                average_score: 0,
                score_trend: 'stable',
                health_consistency: 0,
                critical_periods: 0
            },

            // Production performance
            production_metrics: {
                estimated_total_honey: 0,
                average_productivity: 0,
                peak_production_month: null,
                production_consistency: 0
            },

            // Management efficiency
            management_metrics: {
                inspection_frequency: 0,
                issue_resolution_rate: 0,
                preventive_actions: 0,
                response_time_average: 0
            },

            // Comparative analysis
            benchmarks: {
                vs_apiary_average: 0,
                vs_type_average: 0,
                improvement_areas: []
            }
        };

        if (periodInspections.length > 0) {
            // Calculate health metrics
            const scores = periodInspections
                .filter(i => i.auto_score !== null)
                .map(i => i.auto_score);

            if (scores.length > 0) {
                performance.health_metrics.average_score = Math.round(
                    scores.reduce((sum, score) => sum + score, 0) / scores.length
                );

                // Calculate trend
                if (scores.length >= 2) {
                    const firstHalf = scores.slice(0, Math.floor(scores.length / 2));
                    const secondHalf = scores.slice(Math.floor(scores.length / 2));

                    const firstAvg = firstHalf.reduce((sum, s) => sum + s, 0) / firstHalf.length;
                    const secondAvg = secondHalf.reduce((sum, s) => sum + s, 0) / secondHalf.length;

                    if (secondAvg > firstAvg + 5) {
                        performance.health_metrics.score_trend = 'improving';
                    } else if (secondAvg < firstAvg - 5) {
                        performance.health_metrics.score_trend = 'declining';
                    }
                }

                // Calculate consistency (lower standard deviation = higher consistency)
                const mean = performance.health_metrics.average_score;
                const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
                const stdDev = Math.sqrt(variance);
                performance.health_metrics.health_consistency = Math.max(0, 100 - stdDev);
            }

            // Count critical periods
            performance.health_metrics.critical_periods = periodInspections.filter(
                i => i.overall_status === 'red' || i.risk_level === 'critical'
            ).length;

            // Calculate management metrics
            performance.management_metrics.inspection_frequency =
                periodInspections.length / (period === 'month' ? 1 : period === 'quarter' ? 3 : 12);

            // Calculate issue resolution (simplified)
            const issuesFound = periodInspections.reduce((sum, i) =>
                sum + (i.diseases_found?.length || 0) + (i.pests_found?.length || 0), 0
            );
            const actionsRecommended = periodInspections.reduce((sum, i) =>
                sum + (i.recommendations?.length || 0), 0
            );

            if (issuesFound > 0) {
                performance.management_metrics.issue_resolution_rate =
                    Math.min(100, (actionsRecommended / issuesFound) * 100);
            }
        }

        // Add improvement recommendations
        if (performance.health_metrics.average_score < 70) {
            performance.benchmarks.improvement_areas.push('تحسين الحالة الصحية العامة');
        }

        if (performance.management_metrics.inspection_frequency < 1) {
            performance.benchmarks.improvement_areas.push('زيادة تكرار الفحوصات');
        }

        if (performance.health_metrics.critical_periods > 2) {
            performance.benchmarks.improvement_areas.push('تحسين الاستجابة للحالات الحرجة');
        }

        return performance;
    }

    /**
     * Get hive comparison with others in apiary
     * @param {string} hiveId - Hive ID
     * @param {string} userId - User ID
     * @returns {Promise<Object>}
     */
    async compareHiveWithApiary(hiveId, userId) {
        const hive = await this.getHive(hiveId, userId);

        // Get all hives in the same apiary
        const apiaryHives = await Hive.findAll({
            where: { apiary_id: hive.apiary_id },
            include: [{
                model: Inspection,
                as: 'inspections',
                limit: 1,
                order: [['inspection_date', 'DESC']]
            }]
        });

        const comparison = {
            target_hive: {
                id: hive.id,
                name: hive.name,
                health_score: hive.health_score,
                health_status: hive.health_status
            },
            apiary_stats: {
                total_hives: apiaryHives.length,
                average_health_score: 0,
                health_distribution: {
                    excellent: 0,
                    good: 0,
                    warning: 0,
                    critical: 0
                }
            },
            rankings: {
                health_rank: 0,
                percentile: 0
            },
            recommendations: []
        };

        // Calculate apiary averages
        const healthScores = apiaryHives
            .filter(h => h.health_score !== null)
            .map(h => h.health_score);

        if (healthScores.length > 0) {
            comparison.apiary_stats.average_health_score = Math.round(
                healthScores.reduce((sum, score) => sum + score, 0) / healthScores.length
            );

            // Calculate ranking
            const betterHives = healthScores.filter(score => score > (hive.health_score || 0)).length;
            comparison.rankings.health_rank = betterHives + 1;
            comparison.rankings.percentile = Math.round(
                ((apiaryHives.length - comparison.rankings.health_rank) / apiaryHives.length) * 100
            );
        }

        // Count health distribution
        apiaryHives.forEach(h => {
            if (h.health_status) {
                comparison.apiary_stats.health_distribution[h.health_status]++;
            }
        });

        // Generate recommendations based on comparison
        if (comparison.rankings.percentile < 25) {
            comparison.recommendations.push({
                type: 'improvement_needed',
                message: 'الخلية في الربع الأدنى من المنحل',
                actions: ['فحص شامل', 'مقارنة مع الخلايا الأفضل أداءً', 'تحسين الإدارة']
            });
        } else if (comparison.rankings.percentile > 75) {
            comparison.recommendations.push({
                type: 'excellent_performance',
                message: 'الخلية من الأفضل أداءً في المنحل',
                actions: ['الحفاظ على الأداء الحالي', 'استخدام كمرجع للخلايا الأخرى']
            });
        }

        return comparison;
    }

    // Helper methods
    calculateHiveAge(ageInMonths) {
        return ageInMonths || 0;
    }

    calculateSeasonalProductivity(hive) {
        const currentMonth = new Date().getMonth() + 1;

        // Seasonal productivity factors for Middle East region
        const seasonalFactors = {
            1: 0.2, 2: 0.3, 3: 0.6, 4: 0.9, // Winter to Spring
            5: 1.0, 6: 1.0, 7: 0.8, 8: 0.6, // Spring to Summer
            9: 0.7, 10: 0.8, 11: 0.4, 12: 0.2 // Fall to Winter
        };

        return seasonalFactors[currentMonth] || 0.5;
    }

    getSeasonalHiveAdvice(month, stats) {
        const advice = {
            1: { // January
                actions: ['فحص مخزون الغذاء', 'حماية من البرد', 'تقليل التدخل'],
                focus: 'الحفاظ على الطائفة خلال الشتاء'
            },
            2: { // February
                actions: ['تغذية طارئة إذا لزم', 'فحص الملكة', 'تحضير للربيع'],
                focus: 'التحضير لموسم النشاط'
            },
            3: { // March
                actions: ['بدء التغذية التحفيزية', 'إضافة إطارات', 'فحص النشاط'],
                focus: 'تحفيز نمو الطائفة'
            },
            4: { // April
                actions: ['زيادة المساحة', 'مراقبة التطريد', 'إضافة عسلات'],
                focus: 'إدارة النمو السريع'
            },
            5: { // May
                actions: ['إضافة عسلات العسل', 'مراقبة التطريد', 'حصاد مبكر'],
                focus: 'تحضير لموسم العسل'
            },
            6: { // June
                actions: ['حصاد العسل', 'توفير الماء', 'مراقبة الحرارة'],
                focus: 'إدارة الإنتاج والحرارة'
            },
            7: { // July
                actions: ['حماية من الحر', 'تهوية جيدة', 'مراقبة الآفات'],
                focus: 'الحماية من الإجهاد الحراري'
            },
            8: { // August
                actions: ['علاج الفاروا', 'تحضير للشتاء', 'تقييم الملكات'],
                focus: 'العلاج والتحضير'
            },
            9: { // September
                actions: ['تغذية الشتاء', 'تقليل الحجم', 'علاج الأمراض'],
                focus: 'التحضير للشتاء'
            },
            10: { // October
                actions: ['إكمال التغذية', 'حماية من الرياح', 'فحص أخير'],
                focus: 'الاستعداد النهائي للشتاء'
            },
            11: { // November
                actions: ['تحضير نهائي', 'تقليل الفحوصات', 'حماية من البرد'],
                focus: 'دخول فترة الشتاء'
            },
            12: { // December
                actions: ['مراقبة بدون تدخل', 'حماية من العواصف', 'تخطيط للموسم القادم'],
                focus: 'الحد الأدنى من التدخل'
            }
        };

        const monthlyAdvice = advice[month] || advice[1];

        // Add specific recommendations based on hive stats
        if (stats.production.capacity_utilization > 80 && [4, 5, 6].includes(month)) {
            monthlyAdvice.actions.push('إضافة عسلات إضافية لمنع التطريد');
        }

        if (stats.health.current_status === 'critical') {
            monthlyAdvice.actions.unshift('معالجة المشاكل الصحية الحرجة فوراً');
        }

        return monthlyAdvice;
    }
}

module.exports = HiveService;