const { Apiary, Hive, User, Inspection } = require('../models');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

class ApiaryService {
    /**
     * Create new apiary
     * @param {string} userId - Owner user ID
     * @param {Object} apiaryData - Apiary data
     * @returns {Promise<Apiary>}
     */
    async createApiary(userId, apiaryData) {
        // Validate user exists
        const user = await User.findByPk(userId);
        if (!user) {
            throw new AppError('المستخدم غير موجود', 404, 'USER_NOT_FOUND');
        }

        // Validate location data
        if (!apiaryData.location || !apiaryData.location.latitude || !apiaryData.location.longitude) {
            throw new AppError('بيانات الموقع مطلوبة', 400, 'LOCATION_REQUIRED');
        }

        // Create apiary
        const apiary = await Apiary.create({
            ...apiaryData,
            owner_id: userId
        });

        logger.info(`Created apiary ${apiary.id} for user ${userId}`);
        return apiary;
    }

    /**
     * Get apiary by ID
     * @param {string} apiaryId - Apiary ID
     * @param {string} userId - User ID
     * @param {Object} options - Query options
     * @returns {Promise<Apiary>}
     */
    async getApiary(apiaryId, userId, options = {}) {
        const { includeHives = false, includeStats = false } = options;

        const includeArray = [];

        if (includeHives) {
            includeArray.push({
                model: Hive,
                as: 'hives',
                include: includeStats ? [{
                    model: Inspection,
                    as: 'inspections',
                    limit: 1,
                    order: [['inspection_date', 'DESC']]
                }] : []
            });
        }

        const apiary = await Apiary.findOne({
            where: {
                id: apiaryId,
                owner_id: userId
            },
            include: includeArray
        });

        if (!apiary) {
            throw new AppError('المنحل غير موجود', 404, 'APIARY_NOT_FOUND');
        }

        return apiary;
    }

    /**
     * Update apiary
     * @param {string} apiaryId - Apiary ID
     * @param {string} userId - User ID
     * @param {Object} updateData - Update data
     * @returns {Promise<Apiary>}
     */
    async updateApiary(apiaryId, userId, updateData) {
        const apiary = await this.getApiary(apiaryId, userId);

        // Handle location updates for mobile apiaries
        if (updateData.location && apiary.type === 'mobile') {
            await this.recordLocationHistory(apiary, updateData.location);
        }

        await apiary.update(updateData);

        logger.info(`Updated apiary ${apiaryId}`);
        return apiary;
    }

    /**
     * Delete apiary
     * @param {string} apiaryId - Apiary ID
     * @param {string} userId - User ID
     * @returns {Promise<void>}
     */
    async deleteApiary(apiaryId, userId) {
        const apiary = await this.getApiary(apiaryId, userId, { includeHives: true });

        // Check if apiary has hives
        if (apiary.hives && apiary.hives.length > 0) {
            throw new AppError('لا يمكن حذف منحل يحتوي على خلايا', 400, 'APIARY_HAS_HIVES');
        }

        await apiary.destroy();
        logger.info(`Deleted apiary ${apiaryId}`);
    }

    /**
     * Get user's apiaries
     * @param {string} userId - User ID
     * @param {Object} options - Query options
     * @returns {Promise<Array>}
     */
    async getUserApiaries(userId, options = {}) {
        const {
            type = null,
            includeStats = false,
            limit = 50,
            offset = 0,
            sortBy = 'created_at',
            sortOrder = 'DESC'
        } = options;

        const whereClause = { owner_id: userId };
        if (type) {
            whereClause.type = type;
        }

        const includeArray = [];
        if (includeStats) {
            includeArray.push({
                model: Hive,
                as: 'hives',
                include: [{
                    model: Inspection,
                    as: 'inspections',
                    limit: 1,
                    order: [['inspection_date', 'DESC']]
                }]
            });
        }

        const apiaries = await Apiary.findAll({
            where: whereClause,
            include: includeArray,
            order: [[sortBy, sortOrder]],
            limit,
            offset
        });

        return apiaries;
    }

    /**
     * Get apiary statistics
     * @param {string} apiaryId - Apiary ID
     * @param {string} userId - User ID
     * @returns {Promise<Object>}
     */
    async getApiaryStatistics(apiaryId, userId) {
        const apiary = await this.getApiary(apiaryId, userId, { includeHives: true });

        const stats = {
            apiary_info: {
                id: apiary.id,
                name: apiary.name,
                type: apiary.type,
                created_at: apiary.createdAt
            },

            // Basic counts
            total_hives: apiary.hives?.length || 0,
            active_hives: 0,
            inactive_hives: 0,

            // Hive status distribution
            hive_status_distribution: {},

            // Health overview
            health_overview: {
                excellent: 0,
                good: 0,
                warning: 0,
                critical: 0,
                unknown: 0
            },

            // Recent activity
            recent_inspections: 0,
            overdue_inspections: 0,

            // Production estimates
            estimated_honey_production: 0,
            total_frames: 0,
            productive_frames: 0
        };

        if (apiary.hives && apiary.hives.length > 0) {
            // Calculate statistics
            for (const hive of apiary.hives) {
                // Status distribution
                if (hive.status === 'active') {
                    stats.active_hives++;
                } else {
                    stats.inactive_hives++;
                }

                stats.hive_status_distribution[hive.status] =
                    (stats.hive_status_distribution[hive.status] || 0) + 1;

                // Health distribution
                if (hive.health_status) {
                    stats.health_overview[hive.health_status]++;
                } else {
                    stats.health_overview.unknown++;
                }

                // Frame counts
                if (hive.frames) {
                    stats.total_frames += hive.getTotalFrames();
                    stats.productive_frames += (hive.frames.brood || 0) + (hive.frames.honey || 0);
                }

                // Check for overdue inspections
                if (hive.last_inspection) {
                    const daysSinceInspection = Math.floor(
                        (new Date() - new Date(hive.last_inspection)) / (1000 * 60 * 60 * 24)
                    );

                    if (daysSinceInspection <= 7) {
                        stats.recent_inspections++;
                    } else if (daysSinceInspection > 30) {
                        stats.overdue_inspections++;
                    }
                } else {
                    stats.overdue_inspections++;
                }
            }

            // Estimate honey production (rough calculation)
            stats.estimated_honey_production = Math.round(
                (stats.productive_frames * 1.5) * 100
            ) / 100; // kg
        }

        // Calculate productivity metrics
        stats.productivity_metrics = {
            hives_per_hectare: apiary.area ? Math.round((stats.total_hives / apiary.area) * 100) / 100 : null,
            frames_per_hive: stats.total_hives > 0 ? Math.round((stats.total_frames / stats.total_hives) * 10) / 10 : 0,
            productivity_rate: stats.total_frames > 0 ? Math.round((stats.productive_frames / stats.total_frames) * 100) : 0
        };

        return stats;
    }

    /**
     * Get apiary health report
     * @param {string} apiaryId - Apiary ID
     * @param {string} userId - User ID
     * @returns {Promise<Object>}
     */
    async getApiaryHealthReport(apiaryId, userId) {
        const apiary = await this.getApiary(apiaryId, userId, { includeHives: true, includeStats: true });

        const healthReport = {
            apiary_info: {
                id: apiary.id,
                name: apiary.name,
                total_hives: apiary.hives?.length || 0
            },

            overall_health_score: 0,
            health_distribution: {
                excellent: 0,
                good: 0,
                warning: 0,
                critical: 0
            },

            critical_issues: [],
            recommendations: [],

            hive_details: []
        };

        if (apiary.hives && apiary.hives.length > 0) {
            let totalHealthScore = 0;
            let hivesWithScore = 0;

            for (const hive of apiary.hives) {
                const hiveDetail = {
                    id: hive.id,
                    name: hive.name,
                    status: hive.status,
                    health_status: hive.health_status,
                    health_score: hive.health_score,
                    last_inspection: hive.last_inspection,
                    issues: [],
                    needs_attention: false
                };

                // Count health distribution
                if (hive.health_status) {
                    healthReport.health_distribution[hive.health_status]++;
                }

                // Calculate average health score
                if (hive.health_score !== null) {
                    totalHealthScore += hive.health_score;
                    hivesWithScore++;
                }

                // Check for critical issues
                if (hive.status === 'queenless') {
                    hiveDetail.issues.push('خلية بدون ملكة');
                    hiveDetail.needs_attention = true;
                    healthReport.critical_issues.push({
                        hive_name: hive.name,
                        issue: 'خلية بدون ملكة',
                        severity: 'critical'
                    });
                }

                if (hive.status === 'dead') {
                    hiveDetail.issues.push('خلية ميتة');
                    healthReport.critical_issues.push({
                        hive_name: hive.name,
                        issue: 'خلية ميتة',
                        severity: 'critical'
                    });
                }

                if (hive.health_status === 'critical') {
                    hiveDetail.issues.push('حالة صحية حرجة');
                    hiveDetail.needs_attention = true;
                    healthReport.critical_issues.push({
                        hive_name: hive.name,
                        issue: 'حالة صحية حرجة',
                        severity: 'high'
                    });
                }

                // Check for overdue inspections
                if (hive.last_inspection) {
                    const daysSinceInspection = Math.floor(
                        (new Date() - new Date(hive.last_inspection)) / (1000 * 60 * 60 * 24)
                    );

                    if (daysSinceInspection > 30) {
                        hiveDetail.issues.push(`لم يتم فحصها منذ ${daysSinceInspection} يوم`);
                        hiveDetail.needs_attention = true;
                    }
                } else {
                    hiveDetail.issues.push('لم يتم فحصها مطلقاً');
                    hiveDetail.needs_attention = true;
                }

                healthReport.hive_details.push(hiveDetail);
            }

            // Calculate overall health score
            if (hivesWithScore > 0) {
                healthReport.overall_health_score = Math.round((totalHealthScore / hivesWithScore) * 10) / 10;
            }
        }

        // Generate recommendations
        healthReport.recommendations = this.generateHealthRecommendations(healthReport);

        return healthReport;
    }

    /**
     * Record location history for mobile apiaries
     * @param {Apiary} apiary - Apiary instance
     * @param {Object} newLocation - New location data
     * @returns {Promise<void>}
     */
    async recordLocationHistory(apiary, newLocation) {
        const locationHistory = apiary.location_history || [];

        // Add current location to history
        locationHistory.push({
            ...apiary.location,
            moved_from_date: apiary.updatedAt,
            moved_to_date: new Date()
        });

        // Keep only last 50 locations
        if (locationHistory.length > 50) {
            locationHistory.splice(0, locationHistory.length - 50);
        }

        await apiary.update({ location_history: locationHistory });
    }

    /**
     * Get nearby apiaries
     * @param {string} userId - User ID
     * @param {Object} location - Current location
     * @param {number} radiusKm - Search radius in kilometers
     * @returns {Promise<Array>}
     */
    async getNearbyApiaries(userId, location, radiusKm = 10) {
        const { latitude, longitude } = location;

        // Calculate bounding box for initial filtering
        const latDelta = radiusKm / 111; // Rough conversion: 1 degree ≈ 111 km
        const lonDelta = radiusKm / (111 * Math.cos(latitude * Math.PI / 180));

        const apiaries = await Apiary.findAll({
            where: {
                owner_id: { [Apiary.sequelize.Sequelize.Op.ne]: userId }, // Exclude own apiaries
                // Basic bounding box filter
                '$location.latitude$': {
                    [Apiary.sequelize.Sequelize.Op.between]: [latitude - latDelta, latitude + latDelta]
                },
                '$location.longitude$': {
                    [Apiary.sequelize.Sequelize.Op.between]: [longitude - lonDelta, longitude + lonDelta]
                }
            },
            include: [{
                model: User,
                as: 'owner',
                attributes: ['id', 'name']
            }]
        });

        // Calculate exact distances and filter
        const nearbyApiaries = apiaries
            .map(apiary => {
                const distance = this.calculateDistance(
                    latitude, longitude,
                    apiary.location.latitude, apiary.location.longitude
                );

                return {
                    ...apiary.toJSON(),
                    distance_km: Math.round(distance * 100) / 100
                };
            })
            .filter(apiary => apiary.distance_km <= radiusKm)
            .sort((a, b) => a.distance_km - b.distance_km);

        return nearbyApiaries;
    }

    /**
     * Get apiary recommendations
     * @param {string} apiaryId - Apiary ID
     * @param {string} userId - User ID
     * @returns {Promise<Object>}
     */
    async getApiaryRecommendations(apiaryId, userId) {
        const stats = await this.getApiaryStatistics(apiaryId, userId);
        const healthReport = await this.getApiaryHealthReport(apiaryId, userId);

        const recommendations = {
            priority_actions: [],
            management_suggestions: [],
            expansion_opportunities: [],
            seasonal_advice: []
        };

        // Priority actions based on critical issues
        if (healthReport.critical_issues.length > 0) {
            recommendations.priority_actions.push({
                type: 'urgent',
                title: 'معالجة المشاكل الحرجة',
                description: `${healthReport.critical_issues.length} خلية تحتاج تدخل فوري`,
                action: 'فحص وعلاج الخلايا المتضررة'
            });
        }

        if (stats.overdue_inspections > 0) {
            recommendations.priority_actions.push({
                type: 'inspection',
                title: 'فحوصات متأخرة',
                description: `${stats.overdue_inspections} خلية تحتاج فحص`,
                action: 'جدولة فحوصات للخلايا المتأخرة'
            });
        }

        // Management suggestions
        if (stats.productivity_metrics.productivity_rate < 50) {
            recommendations.management_suggestions.push({
                type: 'productivity',
                title: 'تحسين الإنتاجية',
                description: `معدل الإنتاجية ${stats.productivity_metrics.productivity_rate}% فقط`,
                suggestions: [
                    'زيادة التغذية في المواسم الضعيفة',
                    'تحسين إدارة العسلات',
                    'فحص جودة الملكات'
                ]
            });
        }

        if (stats.total_hives < 10) {
            recommendations.expansion_opportunities.push({
                type: 'expansion',
                title: 'فرصة للتوسع',
                description: 'يمكن إضافة المزيد من الخلايا',
                benefits: [
                    'زيادة الإنتاج',
                    'تحسين الاقتصاديات',
                    'توزيع المخاطر'
                ]
            });
        }

        // Seasonal advice based on current month
        const currentMonth = new Date().getMonth() + 1;
        recommendations.seasonal_advice = this.getSeasonalAdvice(currentMonth);

        return recommendations;
    }

    // Helper methods
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Earth's radius in kilometers
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    generateHealthRecommendations(healthReport) {
        const recommendations = [];

        // Critical issues
        if (healthReport.critical_issues.length > 0) {
            recommendations.push({
                priority: 'high',
                type: 'urgent_action',
                message: `معالجة ${healthReport.critical_issues.length} مشكلة حرجة فوراً`,
                actions: healthReport.critical_issues.map(issue => `معالجة ${issue.issue} في ${issue.hive_name}`)
            });
        }

        // Health distribution analysis
        const totalHives = Object.values(healthReport.health_distribution).reduce((sum, count) => sum + count, 0);
        const criticalPercentage = totalHives > 0 ? (healthReport.health_distribution.critical / totalHives) * 100 : 0;

        if (criticalPercentage > 20) {
            recommendations.push({
                priority: 'high',
                type: 'health_management',
                message: 'نسبة عالية من الخلايا في حالة حرجة',
                actions: [
                    'مراجعة برنامج الإدارة الصحية',
                    'استشارة طبيب بيطري متخصص',
                    'تحسين ظروف المنحل'
                ]
            });
        }

        // Overall health score
        if (healthReport.overall_health_score < 20) {
            recommendations.push({
                priority: 'medium',
                type: 'general_improvement',
                message: 'النقاط الصحية العامة منخفضة',
                actions: [
                    'زيادة تكرار الفحوصات',
                    'تحسين التغذية',
                    'مراجعة ظروف الموقع'
                ]
            });
        }

        return recommendations;
    }

    getSeasonalAdvice(month) {
        const seasonalAdvice = {
            1: { // يناير
                season: 'شتاء',
                advice: [
                    'فحص مخزون الغذاء',
                    'حماية الخلايا من البرد',
                    'تقليل التدخل في الخلايا'
                ]
            },
            2: { // فبراير
                season: 'شتاء',
                advice: [
                    'تغذية طارئة إذا لزم الأمر',
                    'فحص الملكات',
                    'تحضير للموسم القادم'
                ]
            },
            3: { // مارس
                season: 'ربيع مبكر',
                advice: [
                    'بدء التغذية التحفيزية',
                    'إضافة العسلات',
                    'فحص نشاط الملكات'
                ]
            },
            4: { // أبريل
                season: 'ربيع',
                advice: [
                    'زيادة المساحة للحضنة',
                    'مراقبة التطريد',
                    'بدء إنتاج الملكات'
                ]
            },
            5: { // مايو
                season: 'ربيع متأخر',
                advice: [
                    'إضافة عسلات العسل',
                    'مراقبة التطريد بعناية',
                    'حصاد العسل المبكر'
                ]
            },
            6: { // يونيو
                season: 'صيف مبكر',
                advice: [
                    'حصاد العسل الرئيسي',
                    'توفير الماء',
                    'مراقبة الآفات'
                ]
            },
            7: { // يوليو
                season: 'صيف',
                advice: [
                    'حماية من الحر',
                    'مراقبة الفاروا',
                    'تقليل التدخل'
                ]
            },
            8: { // أغسطس
                season: 'صيف',
                advice: [
                    'علاج الفاروا',
                    'تحضير للشتاء',
                    'تقييم الملكات'
                ]
            },
            9: { // سبتمبر
                season: 'خريف مبكر',
                advice: [
                    'تغذية الشتاء',
                    'تقليل حجم الخلايا',
                    'علاج الأمراض'
                ]
            },
            10: { // أكتوبر
                season: 'خريف',
                advice: [
                    'إكمال تغذية الشتاء',
                    'حماية من الرياح',
                    'فحص أخير قبل الشتاء'
                ]
            },
            11: { // نوفمبر
                season: 'خريف متأخر',
                advice: [
                    'تحضير نهائي للشتاء',
                    'تقليل الفحوصات',
                    'حماية من البرد'
                ]
            },
            12: { // ديسمبر
                season: 'شتاء',
                advice: [
                    'مراقبة بدون تدخل',
                    'حماية من العواصف',
                    'تخطيط للموسم القادم'
                ]
            }
        };

        return seasonalAdvice[month] || seasonalAdvice[1];
    }
}

module.exports = ApiaryService;