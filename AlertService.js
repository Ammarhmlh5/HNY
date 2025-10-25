const { Alert, Hive, Apiary, User, Inspection } = require('../models');
const { Op } = require('sequelize');
const NotificationService = require('./NotificationService');

class AlertService {
    // Create a new alert
    static async createAlert(alertData) {
        try {
            const alert = await Alert.create({
                ...alertData,
                created_at: new Date(),
                is_read: false,
                is_resolved: false
            });

            // Send notification if enabled
            if (alertData.send_notification) {
                await NotificationService.sendAlert(alert);
            }

            return alert;
        } catch (error) {
            console.error('Error creating alert:', error);
            throw error;
        }
    }

    // Get alerts for a user with filtering
    static async getAlerts(userId, filters = {}, pagination = {}) {
        try {
            const {
                type,
                priority,
                is_read,
                is_resolved,
                hive_id,
                apiary_id,
                date_from,
                date_to
            } = filters;

            const {
                page = 1,
                limit = 20,
                sort_by = 'created_at',
                sort_order = 'DESC'
            } = pagination;

            const whereClause = { user_id: userId };

            // Apply filters
            if (type) whereClause.type = type;
            if (priority) whereClause.priority = priority;
            if (is_read !== undefined) whereClause.is_read = is_read;
            if (is_resolved !== undefined) whereClause.is_resolved = is_resolved;
            if (hive_id) whereClause.hive_id = hive_id;
            if (apiary_id) whereClause.apiary_id = apiary_id;

            if (date_from || date_to) {
                whereClause.created_at = {};
                if (date_from) whereClause.created_at[Op.gte] = new Date(date_from);
                if (date_to) whereClause.created_at[Op.lte] = new Date(date_to);
            }

            const offset = (page - 1) * limit;

            const { rows: alerts, count } = await Alert.findAndCountAll({
                where: whereClause,
                include: [
                    {
                        model: Hive,
                        as: 'hive',
                        attributes: ['id', 'name', 'hive_type'],
                        include: [{
                            model: Apiary,
                            as: 'apiary',
                            attributes: ['id', 'name', 'location']
                        }]
                    }
                ],
                order: [[sort_by, sort_order]],
                limit,
                offset
            });

            return {
                alerts,
                pagination: {
                    total: count,
                    page,
                    limit,
                    total_pages: Math.ceil(count / limit)
                }
            };
        } catch (error) {
            console.error('Error fetching alerts:', error);
            throw error;
        }
    }

    // Get alert by ID
    static async getAlertById(alertId, userId) {
        try {
            const alert = await Alert.findOne({
                where: { id: alertId, user_id: userId },
                include: [
                    {
                        model: Hive,
                        as: 'hive',
                        attributes: ['id', 'name', 'hive_type'],
                        include: [{
                            model: Apiary,
                            as: 'apiary',
                            attributes: ['id', 'name', 'location']
                        }]
                    }
                ]
            });

            return alert;
        } catch (error) {
            console.error('Error fetching alert:', error);
            throw error;
        }
    }

    // Mark alert as read
    static async markAsRead(alertId, userId) {
        try {
            const [updatedRows] = await Alert.update(
                { is_read: true, read_at: new Date() },
                { where: { id: alertId, user_id: userId } }
            );

            return updatedRows > 0;
        } catch (error) {
            console.error('Error marking alert as read:', error);
            throw error;
        }
    }

    // Mark alert as resolved
    static async markAsResolved(alertId, userId, resolution_notes = null) {
        try {
            const [updatedRows] = await Alert.update(
                {
                    is_resolved: true,
                    resolved_at: new Date(),
                    resolution_notes
                },
                { where: { id: alertId, user_id: userId } }
            );

            return updatedRows > 0;
        } catch (error) {
            console.error('Error marking alert as resolved:', error);
            throw error;
        }
    }

    // Delete alert
    static async deleteAlert(alertId, userId) {
        try {
            const deletedRows = await Alert.destroy({
                where: { id: alertId, user_id: userId }
            });

            return deletedRows > 0;
        } catch (error) {
            console.error('Error deleting alert:', error);
            throw error;
        }
    }

    // Get alert statistics
    static async getAlertStats(userId, days = 30) {
        try {
            const dateFrom = new Date();
            dateFrom.setDate(dateFrom.getDate() - days);

            const stats = await Alert.findAll({
                where: {
                    user_id: userId,
                    created_at: { [Op.gte]: dateFrom }
                },
                attributes: [
                    'type',
                    'priority',
                    'is_resolved',
                    [Alert.sequelize.fn('COUNT', Alert.sequelize.col('id')), 'count']
                ],
                group: ['type', 'priority', 'is_resolved'],
                raw: true
            });

            // Process stats into a more usable format
            const processedStats = {
                total: 0,
                by_type: {},
                by_priority: { high: 0, medium: 0, low: 0 },
                resolved: 0,
                unresolved: 0
            };

            stats.forEach(stat => {
                const count = parseInt(stat.count);
                processedStats.total += count;

                // By type
                if (!processedStats.by_type[stat.type]) {
                    processedStats.by_type[stat.type] = 0;
                }
                processedStats.by_type[stat.type] += count;

                // By priority
                processedStats.by_priority[stat.priority] += count;

                // By resolution status
                if (stat.is_resolved) {
                    processedStats.resolved += count;
                } else {
                    processedStats.unresolved += count;
                }
            });

            return processedStats;
        } catch (error) {
            console.error('Error fetching alert stats:', error);
            throw error;
        }
    }

    // Generate inspection reminders
    static async generateInspectionReminders() {
        try {
            const twoWeeksAgo = new Date();
            twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

            const threeWeeksAgo = new Date();
            threeWeeksAgo.setDate(threeWeeksAgo.getDate() - 21);

            // Find hives that need inspection
            const hivesNeedingInspection = await Hive.findAll({
                include: [
                    {
                        model: Inspection,
                        as: 'inspections',
                        required: false,
                        where: {
                            inspection_date: { [Op.gte]: threeWeeksAgo }
                        },
                        order: [['inspection_date', 'DESC']],
                        limit: 1
                    },
                    {
                        model: Apiary,
                        as: 'apiary',
                        attributes: ['name', 'location']
                    }
                ],
                where: {
                    status: 'active'
                }
            });

            const alertsCreated = [];

            for (const hive of hivesNeedingInspection) {
                const lastInspection = hive.inspections[0];
                let shouldCreateAlert = false;
                let priority = 'medium';
                let message = '';

                if (!lastInspection) {
                    // Never inspected
                    shouldCreateAlert = true;
                    priority = 'high';
                    message = `الخلية ${hive.name} لم يتم فحصها من قبل. يُنصح بإجراء فحص فوري.`;
                } else {
                    const daysSinceInspection = Math.floor(
                        (new Date() - new Date(lastInspection.inspection_date)) / (1000 * 60 * 60 * 24)
                    );

                    if (daysSinceInspection >= 21) {
                        shouldCreateAlert = true;
                        priority = 'high';
                        message = `الخلية ${hive.name} لم يتم فحصها منذ ${daysSinceInspection} يوم. فحص عاجل مطلوب.`;
                    } else if (daysSinceInspection >= 14) {
                        shouldCreateAlert = true;
                        priority = 'medium';
                        message = `الخلية ${hive.name} تحتاج فحص دوري. آخر فحص كان منذ ${daysSinceInspection} يوم.`;
                    }
                }

                if (shouldCreateAlert) {
                    // Check if alert already exists for this hive
                    const existingAlert = await Alert.findOne({
                        where: {
                            hive_id: hive.id,
                            type: 'inspection_reminder',
                            is_resolved: false,
                            created_at: { [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
                        }
                    });

                    if (!existingAlert) {
                        const alert = await this.createAlert({
                            user_id: hive.user_id,
                            hive_id: hive.id,
                            apiary_id: hive.apiary_id,
                            type: 'inspection_reminder',
                            priority,
                            title: 'تذكير فحص الخلية',
                            message,
                            metadata: {
                                days_since_inspection: lastInspection ?
                                    Math.floor((new Date() - new Date(lastInspection.inspection_date)) / (1000 * 60 * 60 * 24)) :
                                    null,
                                last_inspection_date: lastInspection?.inspection_date || null
                            },
                            send_notification: true
                        });

                        alertsCreated.push(alert);
                    }
                }
            }

            return alertsCreated;
        } catch (error) {
            console.error('Error generating inspection reminders:', error);
            throw error;
        }
    }

    // Generate health alerts based on inspection results
    static async generateHealthAlerts(inspectionId) {
        try {
            const inspection = await Inspection.findByPk(inspectionId, {
                include: [
                    {
                        model: Hive,
                        as: 'hive',
                        include: [{
                            model: Apiary,
                            as: 'apiary'
                        }]
                    }
                ]
            });

            if (!inspection) {
                throw new Error('Inspection not found');
            }

            const alerts = [];
            const hive = inspection.hive;

            // Queen-related alerts
            if (inspection.queen_present === 'no') {
                alerts.push({
                    user_id: inspection.user_id,
                    hive_id: inspection.hive_id,
                    apiary_id: hive.apiary_id,
                    type: 'health_issue',
                    priority: 'high',
                    title: 'خلية بدون ملكة',
                    message: `الخلية ${hive.name} بدون ملكة. يجب إدخال ملكة جديدة فوراً لتجنب فقدان الطائفة.`,
                    metadata: {
                        inspection_id: inspectionId,
                        issue_type: 'queenless',
                        severity: 'critical'
                    }
                });
            } else if (inspection.queen_laying === 'no' && inspection.queen_present === 'yes') {
                alerts.push({
                    user_id: inspection.user_id,
                    hive_id: inspection.hive_id,
                    apiary_id: hive.apiary_id,
                    type: 'health_issue',
                    priority: 'high',
                    title: 'ملكة لا تبيض',
                    message: `الملكة في الخلية ${hive.name} موجودة لكنها لا تبيض. قد تحتاج للاستبدال.`,
                    metadata: {
                        inspection_id: inspectionId,
                        issue_type: 'queen_not_laying',
                        severity: 'high'
                    }
                });
            }

            // Brood pattern alerts
            if (inspection.brood_pattern === 'poor' || inspection.brood_pattern === 'none') {
                const severity = inspection.brood_pattern === 'none' ? 'critical' : 'high';
                alerts.push({
                    user_id: inspection.user_id,
                    hive_id: inspection.hive_id,
                    apiary_id: hive.apiary_id,
                    type: 'health_issue',
                    priority: severity === 'critical' ? 'high' : 'medium',
                    title: 'مشكلة في نمط الحضنة',
                    message: `نمط الحضنة في الخلية ${hive.name} ${inspection.brood_pattern === 'none' ? 'غير موجود' : 'ضعيف'}. قد يشير لمشاكل في الملكة أو وجود مرض.`,
                    metadata: {
                        inspection_id: inspectionId,
                        issue_type: 'brood_pattern',
                        severity
                    }
                });
            }

            // Population alerts
            if (inspection.population_strength === 'very_weak' || inspection.population_strength === 'weak') {
                alerts.push({
                    user_id: inspection.user_id,
                    hive_id: inspection.hive_id,
                    apiary_id: hive.apiary_id,
                    type: 'health_issue',
                    priority: inspection.population_strength === 'very_weak' ? 'high' : 'medium',
                    title: 'طائفة ضعيفة',
                    message: `الطائفة في الخلية ${hive.name} ضعيفة. تحتاج تقوية أو دمج مع طائفة أخرى.`,
                    metadata: {
                        inspection_id: inspectionId,
                        issue_type: 'weak_population',
                        severity: inspection.population_strength === 'very_weak' ? 'high' : 'medium'
                    }
                });
            }

            // Food storage alerts
            if (inspection.food_stores === 'critical' || inspection.food_stores === 'none') {
                alerts.push({
                    user_id: inspection.user_id,
                    hive_id: inspection.hive_id,
                    apiary_id: hive.apiary_id,
                    type: 'feeding_required',
                    priority: 'high',
                    title: 'نقص حاد في الغذاء',
                    message: `مخزون الغذاء في الخلية ${hive.name} ${inspection.food_stores === 'none' ? 'منتهي' : 'حرج'}. تغذية فورية مطلوبة.`,
                    metadata: {
                        inspection_id: inspectionId,
                        issue_type: 'food_shortage',
                        severity: 'critical'
                    }
                });
            } else if (inspection.food_stores === 'low') {
                alerts.push({
                    user_id: inspection.user_id,
                    hive_id: inspection.hive_id,
                    apiary_id: hive.apiary_id,
                    type: 'feeding_required',
                    priority: 'medium',
                    title: 'مخزون غذاء منخفض',
                    message: `مخزون الغذاء في الخلية ${hive.name} قليل. ابدأ برنامج تغذية قريباً.`,
                    metadata: {
                        inspection_id: inspectionId,
                        issue_type: 'low_food',
                        severity: 'medium'
                    }
                });
            }

            // Create all alerts
            const createdAlerts = [];
            for (const alertData of alerts) {
                const alert = await this.createAlert({
                    ...alertData,
                    send_notification: true
                });
                createdAlerts.push(alert);
            }

            return createdAlerts;
        } catch (error) {
            console.error('Error generating health alerts:', error);
            throw error;
        }
    }

    // Generate seasonal alerts
    static async generateSeasonalAlerts(userId, season, region = 'saudi_arabia') {
        try {
            const seasonalTasks = this.getSeasonalTasks(season, region);
            const alerts = [];

            for (const task of seasonalTasks) {
                // Check if alert already exists for this season and task
                const existingAlert = await Alert.findOne({
                    where: {
                        user_id: userId,
                        type: 'seasonal_task',
                        'metadata.season': season,
                        'metadata.task_type': task.type,
                        created_at: { [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
                    }
                });

                if (!existingAlert) {
                    const alert = await this.createAlert({
                        user_id: userId,
                        type: 'seasonal_task',
                        priority: task.priority,
                        title: task.title,
                        message: task.message,
                        metadata: {
                            season,
                            task_type: task.type,
                            region,
                            recommended_timing: task.timing
                        },
                        send_notification: task.priority === 'high'
                    });

                    alerts.push(alert);
                }
            }

            return alerts;
        } catch (error) {
            console.error('Error generating seasonal alerts:', error);
            throw error;
        }
    }

    // Get seasonal tasks based on season and region
    static getSeasonalTasks(season, region) {
        const tasks = {
            spring: [
                {
                    type: 'queen_check',
                    title: 'فحص الملكات الربيعي',
                    message: 'الربيع وقت مثالي لفحص الملكات واستبدال الضعيفة منها. تأكد من نشاط الملكة ووضع البيض.',
                    priority: 'high',
                    timing: 'early_spring'
                },
                {
                    type: 'super_addition',
                    title: 'إضافة العسلات',
                    message: 'مع بداية موسم الرحيق، تأكد من إضافة العسلات لتجنب التطريد وزيادة إنتاج العسل.',
                    priority: 'high',
                    timing: 'mid_spring'
                },
                {
                    type: 'swarm_prevention',
                    title: 'منع التطريد',
                    message: 'راقب علامات التطريد وقم بالإجراءات الوقائية مثل توسيع المساحة وإزالة بيوت الملكات.',
                    priority: 'medium',
                    timing: 'late_spring'
                }
            ],
            summer: [
                {
                    type: 'water_provision',
                    title: 'توفير الماء',
                    message: 'في الحر الشديد، تأكد من توفير مصادر مياه نظيفة قريبة من المناحل.',
                    priority: 'high',
                    timing: 'early_summer'
                },
                {
                    type: 'shade_protection',
                    title: 'الحماية من الحر',
                    message: 'وفر الظل للخلايا واستخدم التهوية المناسبة لحماية النحل من الحر الشديد.',
                    priority: 'high',
                    timing: 'mid_summer'
                },
                {
                    type: 'honey_harvest',
                    title: 'قطف العسل',
                    message: 'وقت قطف العسل الصيفي. تأكد من نضج العسل قبل القطف واترك مخزون كافي للنحل.',
                    priority: 'medium',
                    timing: 'late_summer'
                }
            ],
            autumn: [
                {
                    type: 'winter_preparation',
                    title: 'التحضير للشتاء',
                    message: 'ابدأ التحضير للشتاء بفحص مخزون الغذاء وتقوية الطوائف الضعيفة.',
                    priority: 'high',
                    timing: 'early_autumn'
                },
                {
                    type: 'feeding_program',
                    title: 'برنامج التغذية',
                    message: 'ابدأ برنامج التغذية الخريفي لضمان مخزون كافي للشتاء.',
                    priority: 'high',
                    timing: 'mid_autumn'
                },
                {
                    type: 'varroa_treatment',
                    title: 'علاج الفاروا',
                    message: 'الخريف وقت مثالي لعلاج الفاروا قبل دخول الشتاء.',
                    priority: 'medium',
                    timing: 'late_autumn'
                }
            ],
            winter: [
                {
                    type: 'minimal_inspection',
                    title: 'فحص محدود',
                    message: 'قلل الفحوصات في الشتاء واكتفي بالفحص الخارجي ومراقبة النشاط.',
                    priority: 'medium',
                    timing: 'early_winter'
                },
                {
                    type: 'emergency_feeding',
                    title: 'التغذية الطارئة',
                    message: 'راقب مخزون الغذاء وقدم التغذية الطارئة عند الحاجة.',
                    priority: 'high',
                    timing: 'mid_winter'
                },
                {
                    type: 'equipment_maintenance',
                    title: 'صيانة المعدات',
                    message: 'استغل فترة الشتاء في صيانة وتنظيف معدات النحل.',
                    priority: 'low',
                    timing: 'late_winter'
                }
            ]
        };

        return tasks[season] || [];
    }

    // Bulk mark alerts as read
    static async bulkMarkAsRead(alertIds, userId) {
        try {
            const [updatedRows] = await Alert.update(
                { is_read: true, read_at: new Date() },
                {
                    where: {
                        id: { [Op.in]: alertIds },
                        user_id: userId
                    }
                }
            );

            return updatedRows;
        } catch (error) {
            console.error('Error bulk marking alerts as read:', error);
            throw error;
        }
    }

    // Bulk delete alerts
    static async bulkDeleteAlerts(alertIds, userId) {
        try {
            const deletedRows = await Alert.destroy({
                where: {
                    id: { [Op.in]: alertIds },
                    user_id: userId
                }
            });

            return deletedRows;
        } catch (error) {
            console.error('Error bulk deleting alerts:', error);
            throw error;
        }
    }
}

module.exports = AlertService;