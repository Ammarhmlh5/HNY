const { FeedingPlan, Feeding, Hive, Apiary, User } = require('../models');
const { Op } = require('sequelize');
const FeedingService = require('./FeedingService');
const AlertService = require('./AlertService');

class FeedingPlannerService {
    // Create a comprehensive feeding plan
    static async createFeedingPlan(planData) {
        try {
            const plan = await FeedingPlan.create({
                ...planData,
                created_at: new Date(),
                is_active: true
            });

            // Generate scheduled feedings based on the plan
            if (planData.auto_generate_schedule) {
                await this.generateScheduledFeedings(plan);
            }

            return plan;
        } catch (error) {
            console.error('Error creating feeding plan:', error);
            throw error;
        }
    }

    // Generate automatic feeding schedule
    static async generateScheduledFeedings(plan) {
        try {
            const hives = await this.getHivesForPlan(plan);
            const scheduleItems = [];

            for (const hive of hives) {
                const hiveSchedule = await this.generateHiveSchedule(hive, plan);
                scheduleItems.push(...hiveSchedule);
            }

            // Create feeding records for each schedule item
            const createdFeedings = [];
            for (const item of scheduleItems) {
                const feeding = await FeedingService.createFeeding(item);
                createdFeedings.push(feeding);
            }

            return createdFeedings;
        } catch (error) {
            console.error('Error generating scheduled feedings:', error);
            throw error;
        }
    }

    // Generate feeding schedule for a specific hive
    static async generateHiveSchedule(hive, plan) {
        try {
            const schedule = [];
            const startDate = new Date(plan.start_date);
            const endDate = new Date(plan.end_date);

            // Get hive condition data
            const hiveData = {
                population_strength: hive.population_strength || 'moderate',
                food_stores: hive.food_stores || 'adequate',
                brood_pattern: hive.brood_pattern || 'good',
                hive_type: hive.hive_type || 'langstroth'
            };

            // Determine feeding frequency based on plan type and hive condition
            const frequency = this.calculateFeedingFrequency(plan.plan_type, hiveData, plan.season);

            let currentDate = new Date(startDate);
            let feedingNumber = 1;

            while (currentDate <= endDate) {
                // Calculate feeding amounts for this date
                const calculation = FeedingService.calculateFeedingAmounts(
                    hiveData,
                    plan.primary_feeding_type,
                    plan.season
                );

                const feedingItem = {
                    user_id: plan.user_id,
                    hive_id: hive.id,
                    apiary_id: hive.apiary_id,
                    feeding_type: plan.primary_feeding_type,
                    feeding_date: new Date(currentDate),
                    ingredients: calculation.amounts,
                    total_cost: calculation.total_cost,
                    feeding_method: plan.feeding_method || 'top_feeder',
                    status: 'planned',
                    plan_id: plan.id,
                    notes: `${plan.name} - تغذية رقم ${feedingNumber}`,
                    batch_id: `plan_${plan.id}_${hive.id}`
                };

                schedule.push(feedingItem);

                // Move to next feeding date
                currentDate.setDate(currentDate.getDate() + frequency);
                feedingNumber++;
            }

            return schedule;
        } catch (error) {
            console.error('Error generating hive schedule:', error);
            throw error;
        }
    }

    // Calculate feeding frequency based on plan type and hive condition
    static calculateFeedingFrequency(planType, hiveData, season) {
        let baseFrequency;

        // Base frequency by plan type
        switch (planType) {
            case 'emergency':
                baseFrequency = 1; // Daily
                break;
            case 'stimulative':
                baseFrequency = 2; // Every 2 days
                break;
            case 'maintenance':
                baseFrequency = 7; // Weekly
                break;
            case 'winter_prep':
                baseFrequency = 3; // Every 3 days
                break;
            case 'spring_buildup':
                baseFrequency = 2; // Every 2 days
                break;
            default:
                baseFrequency = 3; // Default every 3 days
        }

        // Adjust based on hive condition
        if (hiveData.food_stores === 'critical' || hiveData.food_stores === 'none') {
            baseFrequency = Math.max(1, baseFrequency - 1);
        } else if (hiveData.food_stores === 'abundant') {
            baseFrequency = baseFrequency + 2;
        }

        if (hiveData.population_strength === 'very_weak') {
            baseFrequency = Math.max(1, baseFrequency - 1);
        } else if (hiveData.population_strength === 'very_strong') {
            baseFrequency = baseFrequency + 1;
        }

        // Seasonal adjustments
        const seasonalMultipliers = {
            spring: 0.8, // More frequent in spring
            summer: 1.2, // Less frequent in summer (natural nectar)
            autumn: 0.9, // More frequent in autumn (winter prep)
            winter: 1.1  // Less frequent in winter
        };

        const multiplier = seasonalMultipliers[season] || 1.0;
        return Math.max(1, Math.round(baseFrequency * multiplier));
    }

    // Get hives for a feeding plan
    static async getHivesForPlan(plan) {
        try {
            let whereClause = { user_id: plan.user_id, status: 'active' };

            if (plan.target_hives && plan.target_hives.length > 0) {
                whereClause.id = { [Op.in]: plan.target_hives };
            } else if (plan.target_apiaries && plan.target_apiaries.length > 0) {
                whereClause.apiary_id = { [Op.in]: plan.target_apiaries };
            }

            const hives = await Hive.findAll({
                where: whereClause,
                include: [{
                    model: Apiary,
                    as: 'apiary',
                    attributes: ['id', 'name', 'location']
                }]
            });

            return hives;
        } catch (error) {
            console.error('Error getting hives for plan:', error);
            throw error;
        }
    }

    // Generate shopping list for a feeding plan
    static async generateShoppingList(planId) {
        try {
            const plan = await FeedingPlan.findByPk(planId);
            if (!plan) {
                throw new Error('Feeding plan not found');
            }

            // Get all planned feedings for this plan
            const feedings = await Feeding.findAll({
                where: {
                    plan_id: planId,
                    status: 'planned'
                }
            });

            // Aggregate ingredients
            const totalIngredients = {};
            let totalCost = 0;

            feedings.forEach(feeding => {
                if (feeding.ingredients) {
                    Object.entries(feeding.ingredients).forEach(([ingredient, amount]) => {
                        if (!totalIngredients[ingredient]) {
                            totalIngredients[ingredient] = 0;
                        }
                        totalIngredients[ingredient] += amount;
                    });
                }
                totalCost += parseFloat(feeding.total_cost) || 0;
            });

            // Generate shopping list with package sizes
            const shoppingList = FeedingService.generateShoppingList(totalIngredients);

            return {
                plan_id: planId,
                plan_name: plan.name,
                total_feedings: feedings.length,
                total_ingredients: totalIngredients,
                shopping_list: shoppingList,
                estimated_total_cost: totalCost,
                generated_at: new Date()
            };
        } catch (error) {
            console.error('Error generating shopping list:', error);
            throw error;
        }
    }

    // Create feeding reminders
    static async createFeedingReminders() {
        try {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(0, 0, 0, 0);

            const dayAfterTomorrow = new Date(tomorrow);
            dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

            // Find feedings scheduled for tomorrow
            const upcomingFeedings = await Feeding.findAll({
                where: {
                    feeding_date: {
                        [Op.between]: [tomorrow, dayAfterTomorrow]
                    },
                    status: 'planned'
                },
                include: [
                    {
                        model: Hive,
                        as: 'hive',
                        attributes: ['id', 'name'],
                        include: [{
                            model: Apiary,
                            as: 'apiary',
                            attributes: ['id', 'name']
                        }]
                    }
                ]
            });

            const reminders = [];

            for (const feeding of upcomingFeedings) {
                // Check if reminder already exists
                const existingAlert = await AlertService.getAlerts(feeding.user_id, {
                    type: 'feeding_reminder',
                    hive_id: feeding.hive_id,
                    date_from: new Date().toISOString().split('T')[0]
                });

                if (existingAlert.alerts.length === 0) {
                    const reminder = await AlertService.createAlert({
                        user_id: feeding.user_id,
                        hive_id: feeding.hive_id,
                        apiary_id: feeding.apiary_id,
                        type: 'feeding_reminder',
                        priority: 'medium',
                        title: 'تذكير تغذية',
                        message: `تذكير: تغذية مجدولة غداً للخلية ${feeding.hive?.name} - ${this.getFeedingTypeLabel(feeding.feeding_type)}`,
                        metadata: {
                            feeding_id: feeding.id,
                            feeding_type: feeding.feeding_type,
                            feeding_date: feeding.feeding_date,
                            estimated_cost: feeding.total_cost
                        },
                        send_notification: true
                    });

                    reminders.push(reminder);
                }
            }

            return reminders;
        } catch (error) {
            console.error('Error creating feeding reminders:', error);
            throw error;
        }
    }

    // Check for overdue feedings and create alerts
    static async checkOverdueFeedings() {
        try {
            const today = new Date();
            today.setHours(23, 59, 59, 999);

            const overdueFeedings = await Feeding.findAll({
                where: {
                    feeding_date: { [Op.lt]: today },
                    status: 'planned'
                },
                include: [
                    {
                        model: Hive,
                        as: 'hive',
                        attributes: ['id', 'name'],
                        include: [{
                            model: Apiary,
                            as: 'apiary',
                            attributes: ['id', 'name']
                        }]
                    }
                ]
            });

            const alerts = [];

            for (const feeding of overdueFeedings) {
                const daysPastDue = Math.floor((today - new Date(feeding.feeding_date)) / (1000 * 60 * 60 * 24));

                // Check if alert already exists for this overdue feeding
                const existingAlert = await AlertService.getAlerts(feeding.user_id, {
                    type: 'overdue_feeding',
                    hive_id: feeding.hive_id,
                    date_from: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                });

                if (existingAlert.alerts.length === 0) {
                    const priority = daysPastDue > 3 ? 'high' : 'medium';

                    const alert = await AlertService.createAlert({
                        user_id: feeding.user_id,
                        hive_id: feeding.hive_id,
                        apiary_id: feeding.apiary_id,
                        type: 'overdue_feeding',
                        priority: priority,
                        title: 'تغذية متأخرة',
                        message: `تغذية متأخرة ${daysPastDue} يوم للخلية ${feeding.hive?.name} - ${this.getFeedingTypeLabel(feeding.feeding_type)}`,
                        metadata: {
                            feeding_id: feeding.id,
                            feeding_type: feeding.feeding_type,
                            original_date: feeding.feeding_date,
                            days_overdue: daysPastDue
                        },
                        send_notification: true
                    });

                    alerts.push(alert);
                }
            }

            return alerts;
        } catch (error) {
            console.error('Error checking overdue feedings:', error);
            throw error;
        }
    }

    // Get feeding plans for a user
    static async getFeedingPlans(userId, filters = {}, pagination = {}) {
        try {
            const {
                plan_type,
                is_active,
                season,
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

            if (plan_type) whereClause.plan_type = plan_type;
            if (is_active !== undefined) whereClause.is_active = is_active;
            if (season) whereClause.season = season;

            if (date_from || date_to) {
                whereClause.start_date = {};
                if (date_from) whereClause.start_date[Op.gte] = new Date(date_from);
                if (date_to) whereClause.start_date[Op.lte] = new Date(date_to);
            }

            const offset = (page - 1) * limit;

            const { rows: plans, count } = await FeedingPlan.findAndCountAll({
                where: whereClause,
                order: [[sort_by, sort_order]],
                limit,
                offset
            });

            return {
                plans,
                pagination: {
                    total: count,
                    page,
                    limit,
                    total_pages: Math.ceil(count / limit)
                }
            };
        } catch (error) {
            console.error('Error fetching feeding plans:', error);
            throw error;
        }
    }

    // Update feeding plan
    static async updateFeedingPlan(planId, updateData, userId) {
        try {
            const [updatedRows] = await FeedingPlan.update(
                updateData,
                {
                    where: {
                        id: planId,
                        user_id: userId
                    }
                }
            );

            if (updatedRows === 0) {
                return null;
            }

            return await FeedingPlan.findByPk(planId);
        } catch (error) {
            console.error('Error updating feeding plan:', error);
            throw error;
        }
    }

    // Delete feeding plan
    static async deleteFeedingPlan(planId, userId) {
        try {
            // First, delete associated feedings
            await Feeding.destroy({
                where: {
                    plan_id: planId,
                    user_id: userId,
                    status: 'planned' // Only delete planned feedings
                }
            });

            // Then delete the plan
            const deletedRows = await FeedingPlan.destroy({
                where: {
                    id: planId,
                    user_id: userId
                }
            });

            return deletedRows > 0;
        } catch (error) {
            console.error('Error deleting feeding plan:', error);
            throw error;
        }
    }

    // Activate/Deactivate feeding plan
    static async togglePlanStatus(planId, userId) {
        try {
            const plan = await FeedingPlan.findOne({
                where: { id: planId, user_id: userId }
            });

            if (!plan) {
                return null;
            }

            const newStatus = !plan.is_active;

            await plan.update({ is_active: newStatus });

            // If deactivating, cancel all planned feedings
            if (!newStatus) {
                await Feeding.update(
                    { status: 'cancelled' },
                    {
                        where: {
                            plan_id: planId,
                            status: 'planned'
                        }
                    }
                );
            }

            return plan;
        } catch (error) {
            console.error('Error toggling plan status:', error);
            throw error;
        }
    }

    // Get feeding plan statistics
    static async getPlanStatistics(planId) {
        try {
            const plan = await FeedingPlan.findByPk(planId);
            if (!plan) {
                throw new Error('Plan not found');
            }

            const feedings = await Feeding.findAll({
                where: { plan_id: planId },
                attributes: [
                    'status',
                    'total_cost',
                    [Feeding.sequelize.fn('COUNT', Feeding.sequelize.col('id')), 'count'],
                    [Feeding.sequelize.fn('SUM', Feeding.sequelize.col('total_cost')), 'total_spent']
                ],
                group: ['status'],
                raw: true
            });

            const stats = {
                plan_id: planId,
                plan_name: plan.name,
                total_feedings: 0,
                completed_feedings: 0,
                planned_feedings: 0,
                cancelled_feedings: 0,
                total_cost: 0,
                completion_rate: 0,
                average_cost: 0
            };

            feedings.forEach(feeding => {
                const count = parseInt(feeding.count);
                const cost = parseFloat(feeding.total_spent) || 0;

                stats.total_feedings += count;
                stats.total_cost += cost;

                switch (feeding.status) {
                    case 'completed':
                        stats.completed_feedings = count;
                        break;
                    case 'planned':
                        stats.planned_feedings = count;
                        break;
                    case 'cancelled':
                        stats.cancelled_feedings = count;
                        break;
                }
            });

            stats.completion_rate = stats.total_feedings > 0
                ? (stats.completed_feedings / stats.total_feedings) * 100
                : 0;

            stats.average_cost = stats.total_feedings > 0
                ? stats.total_cost / stats.total_feedings
                : 0;

            return stats;
        } catch (error) {
            console.error('Error getting plan statistics:', error);
            throw error;
        }
    }

    // Generate feeding calendar for a user
    static async generateFeedingCalendar(userId, startDate, endDate) {
        try {
            const feedings = await Feeding.findAll({
                where: {
                    user_id: userId,
                    feeding_date: {
                        [Op.between]: [new Date(startDate), new Date(endDate)]
                    }
                },
                include: [
                    {
                        model: Hive,
                        as: 'hive',
                        attributes: ['id', 'name'],
                        include: [{
                            model: Apiary,
                            as: 'apiary',
                            attributes: ['id', 'name']
                        }]
                    }
                ],
                order: [['feeding_date', 'ASC']]
            });

            // Group feedings by date
            const calendar = {};

            feedings.forEach(feeding => {
                const dateKey = feeding.feeding_date.toISOString().split('T')[0];

                if (!calendar[dateKey]) {
                    calendar[dateKey] = [];
                }

                calendar[dateKey].push({
                    id: feeding.id,
                    feeding_type: feeding.feeding_type,
                    hive_name: feeding.hive?.name,
                    apiary_name: feeding.hive?.apiary?.name,
                    status: feeding.status,
                    cost: feeding.total_cost,
                    notes: feeding.notes
                });
            });

            return calendar;
        } catch (error) {
            console.error('Error generating feeding calendar:', error);
            throw error;
        }
    }

    // Helper method to get feeding type label
    static getFeedingTypeLabel(type) {
        const labels = {
            sugar_syrup: 'محلول سكري',
            honey_syrup: 'محلول عسل',
            pollen_patty: 'عجينة حبوب لقاح',
            protein_patty: 'عجينة بروتين',
            emergency_feeding: 'تغذية طارئة',
            winter_feeding: 'تغذية شتوية',
            stimulative_feeding: 'تغذية محفزة',
            maintenance_feeding: 'تغذية صيانة'
        };
        return labels[type] || type;
    }

    // Create seasonal feeding recommendations
    static async createSeasonalRecommendations(userId, season, region = 'saudi_arabia') {
        try {
            const recommendations = this.getSeasonalFeedingRecommendations(season, region);
            const alerts = [];

            for (const recommendation of recommendations) {
                const alert = await AlertService.createAlert({
                    user_id: userId,
                    type: 'seasonal_feeding',
                    priority: recommendation.priority,
                    title: recommendation.title,
                    message: recommendation.message,
                    metadata: {
                        season: season,
                        region: region,
                        feeding_type: recommendation.feeding_type,
                        timing: recommendation.timing
                    },
                    send_notification: recommendation.priority === 'high'
                });

                alerts.push(alert);
            }

            return alerts;
        } catch (error) {
            console.error('Error creating seasonal recommendations:', error);
            throw error;
        }
    }

    // Get seasonal feeding recommendations
    static getSeasonalFeedingRecommendations(season, region) {
        const recommendations = {
            spring: [
                {
                    feeding_type: 'stimulative_feeding',
                    title: 'تغذية محفزة للربيع',
                    message: 'ابدأ التغذية المحفزة لتشجيع وضع البيض وبناء الطائفة',
                    priority: 'high',
                    timing: 'early_spring'
                },
                {
                    feeding_type: 'pollen_patty',
                    title: 'تغذية بروتينية',
                    message: 'قدم عجائن حبوب اللقاح لدعم تربية الحضنة',
                    priority: 'medium',
                    timing: 'mid_spring'
                }
            ],
            summer: [
                {
                    feeding_type: 'emergency_feeding',
                    title: 'تغذية طارئة عند الحاجة',
                    message: 'راقب مخزون الغذاء وقدم التغذية الطارئة عند انقطاع الرحيق',
                    priority: 'medium',
                    timing: 'mid_summer'
                }
            ],
            autumn: [
                {
                    feeding_type: 'winter_feeding',
                    title: 'تغذية التحضير للشتاء',
                    message: 'ابدأ برنامج التغذية الشتوية لبناء مخزون كافي',
                    priority: 'high',
                    timing: 'early_autumn'
                },
                {
                    feeding_type: 'sugar_syrup',
                    title: 'محلول سكري مركز',
                    message: 'استخدم محلول سكري 2:1 لبناء مخزون العسل',
                    priority: 'high',
                    timing: 'late_autumn'
                }
            ],
            winter: [
                {
                    feeding_type: 'emergency_feeding',
                    title: 'تغذية طارئة شتوية',
                    message: 'راقب مخزون الغذاء وقدم التغذية الطارئة عند الحاجة',
                    priority: 'high',
                    timing: 'mid_winter'
                }
            ]
        };

        return recommendations[season] || [];
    }
}

module.exports = FeedingPlannerService;