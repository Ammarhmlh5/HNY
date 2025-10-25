const { FeedingPlan, Feeding, Hive, Apiary, User } = require('../models');
const { Op } = require('sequelize');
const FeedingService = require('./FeedingService');
const AlertService = require('./AlertService');

class FeedingPlanService {
    // Create a new feeding plan
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

    // Get feeding plans with filtering
    static async getFeedingPlans(userId, filters = {}, pagination = {}) {
        try {
            const {
                hive_id,
                apiary_id,
                plan_type,
                is_active,
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
            if (hive_id) whereClause.hive_id = hive_id;
            if (apiary_id) whereClause.apiary_id = apiary_id;
            if (plan_type) whereClause.plan_type = plan_type;
            if (is_active !== undefined) whereClause.is_active = is_active;

            if (date_from || date_to) {
                whereClause.start_date = {};
                if (date_from) whereClause.start_date[Op.gte] = new Date(date_from);
                if (date_to) whereClause.start_date[Op.lte] = new Date(date_to);
            }

            const offset = (page - 1) * limit;

            const { rows: plans, count } = await FeedingPlan.findAndCountAll({
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

    // Generate scheduled feedings based on plan
    static async generateScheduledFeedings(plan) {
        try {
            const schedule = this.calculateFeedingSchedule(plan);
            const createdFeedings = [];

            for (const scheduleItem of schedule) {
                // Calculate feeding amounts for this date
                const hiveData = await this.getHiveDataForCalculation(plan.hive_id);
                const calculation = FeedingService.calculateFeedingAmounts(
                    hiveData,
                    plan.feeding_type,
                    this.getSeasonForDate(scheduleItem.date)
                );

                const feedingData = {
                    user_id: plan.user_id,
                    hive_id: plan.hive_id,
                    apiary_id: plan.apiary_id,
                    feeding_plan_id: plan.id,
                    feeding_type: plan.feeding_type,
                    feeding_date: scheduleItem.date,
                    ingredients: calculation.amounts,
                    total_cost: calculation.total_cost * scheduleItem.amount_multiplier,
                    feeding_method: plan.feeding_method || 'top_feeder',
                    status: 'planned',
                    notes: `تغذية مجدولة - ${plan.name}`,
                    batch_id: `plan_${plan.id}_${Date.now()}`
                };

                const feeding = await FeedingService.createFeeding(feedingData);
                createdFeedings.push(feeding);
            }

            // Update plan with generated feedings count
            await plan.update({
                generated_feedings_count: createdFeedings.length,
                last_generation_date: new Date()
            });

            return createdFeedings;
        } catch (error) {
            console.error('Error generating scheduled feedings:', error);
            throw error;
        }
    }

    // Calculate feeding schedule based on plan parameters
    static calculateFeedingSchedule(plan) {
        const schedule = [];
        const startDate = new Date(plan.start_date);
        const endDate = plan.end_date ? new Date(plan.end_date) : this.getDefaultEndDate(startDate, plan.plan_type);

        let currentDate = new Date(startDate);
        let feedingNumber = 1;

        while (currentDate <= endDate) {
            const scheduleItem = {
                date: new Date(currentDate),
                feeding_number: feedingNumber,
                amount_multiplier: this.getAmountMultiplier(plan, feedingNumber, currentDate),
                notes: this.getScheduleNotes(plan, feedingNumber, currentDate)
            };

            schedule.push(scheduleItem);

            // Calculate next feeding date based on frequency
            currentDate = this.getNextFeedingDate(currentDate, plan.frequency_days, plan.frequency_pattern);
            feedingNumber++;

            // Safety check to prevent infinite loops
            if (feedingNumber > 1000) {
                console.warn('Feeding schedule generation stopped at 1000 feedings to prevent infinite loop');
                break;
            }
        }

        return schedule;
    }

    // Get next feeding date based on frequency pattern
    static getNextFeedingDate(currentDate, frequencyDays, frequencyPattern) {
        const nextDate = new Date(currentDate);

        switch (frequencyPattern) {
            case 'daily':
                nextDate.setDate(nextDate.getDate() + (frequencyDays || 1));
                break;
            case 'weekly':
                nextDate.setDate(nextDate.getDate() + ((frequencyDays || 1) * 7));
                break;
            case 'bi_weekly':
                nextDate.setDate(nextDate.getDate() + 14);
                break;
            case 'monthly':
                nextDate.setMonth(nextDate.getMonth() + (frequencyDays || 1));
                break;
            case 'custom':
                nextDate.setDate(nextDate.getDate() + (frequencyDays || 7));
                break;
            default:
                nextDate.setDate(nextDate.getDate() + (frequencyDays || 7));
        }

        return nextDate;
    }

    // Get amount multiplier based on plan progression
    static getAmountMultiplier(plan, feedingNumber, currentDate) {
        switch (plan.progression_type) {
            case 'constant':
                return 1.0;
            case 'increasing':
                return Math.min(1.0 + (feedingNumber - 1) * 0.1, 2.0);
            case 'decreasing':
                return Math.max(1.0 - (feedingNumber - 1) * 0.1, 0.3);
            case 'seasonal':
                return this.getSeasonalMultiplier(currentDate);
            default:
                return 1.0;
        }
    }

    // Get seasonal multiplier
    static getSeasonalMultiplier(date) {
        const month = date.getMonth() + 1;

        if (month >= 3 && month <= 5) return 1.3; // Spring - more feeding
        if (month >= 6 && month <= 8) return 0.8; // Summer - less feeding
        if (month >= 9 && month <= 11) return 1.5; // Autumn - preparation for winter
        return 1.0; // Winter - maintenance
    }

    // Get schedule notes
    static getScheduleNotes(plan, feedingNumber, currentDate) {
        const notes = [];

        if (feedingNumber === 1) {
            notes.push('بداية برنامج التغذية');
        }

        if (feedingNumber % 7 === 0) {
            notes.push('فحص أسبوعي - قيم استجابة النحل');
        }

        const season = this.getSeasonForDate(currentDate);
        if (season === 'winter' && feedingNumber > 5) {
            notes.push('تقليل التغذية في الشتاء');
        }

        if (plan.plan_type === 'emergency' && feedingNumber > 10) {
            notes.push('قيم إمكانية تقليل التغذية الطارئة');
        }

        return notes.join(' • ');
    }

    // Get season for date
    static getSeasonForDate(date) {
        const month = date.getMonth() + 1;
        if (month >= 3 && month <= 5) return 'spring';
        if (month >= 6 && month <= 8) return 'summer';
        if (month >= 9 && month <= 11) return 'autumn';
        return 'winter';
    }

    // Get default end date based on plan type
    static getDefaultEndDate(startDate, planType) {
        const endDate = new Date(startDate);

        switch (planType) {
            case 'emergency':
                endDate.setDate(endDate.getDate() + 14); // 2 weeks
                break;
            case 'stimulative':
                endDate.setDate(endDate.getDate() + 30); // 1 month
                break;
            case 'maintenance':
                endDate.setMonth(endDate.getMonth() + 3); // 3 months
                break;
            case 'seasonal':
                endDate.setMonth(endDate.getMonth() + 6); // 6 months
                break;
            case 'winter_prep':
                endDate.setDate(endDate.getDate() + 60); // 2 months
                break;
            default:
                endDate.setMonth(endDate.getMonth() + 2); // 2 months default
        }

        return endDate;
    }

    // Get hive data for calculation
    static async getHiveDataForCalculation(hiveId) {
        try {
            const hive = await Hive.findByPk(hiveId, {
                include: [{
                    model: Inspection,
                    as: 'inspections',
                    order: [['inspection_date', 'DESC']],
                    limit: 1
                }]
            });

            if (!hive) {
                throw new Error('Hive not found');
            }

            const latestInspection = hive.inspections?.[0];

            return {
                population_strength: latestInspection?.population_strength || hive.population_strength || 'moderate',
                food_stores: latestInspection?.food_stores || hive.food_stores || 'adequate',
                brood_pattern: latestInspection?.brood_pattern || hive.brood_pattern || 'good',
                hive_type: hive.hive_type || 'langstroth'
            };
        } catch (error) {
            console.error('Error getting hive data:', error);
            // Return default values if hive data cannot be retrieved
            return {
                population_strength: 'moderate',
                food_stores: 'adequate',
                brood_pattern: 'good',
                hive_type: 'langstroth'
            };
        }
    }

    // Generate shopping list for feeding plan
    static async generateShoppingList(planId, userId) {
        try {
            const plan = await FeedingPlan.findOne({
                where: { id: planId, user_id: userId }
            });

            if (!plan) {
                throw new Error('Feeding plan not found');
            }

            // Get all planned feedings for this plan
            const feedings = await Feeding.findAll({
                where: {
                    feeding_plan_id: planId,
                    status: 'planned'
                }
            });

            // Calculate total ingredients needed
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
                total_cost: totalCost,
                total_ingredients: totalIngredients,
                shopping_list: shoppingList,
                generated_at: new Date()
            };
        } catch (error) {
            console.error('Error generating shopping list:', error);
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

            const updatedPlan = await FeedingPlan.findByPk(planId);

            // If the plan was reactivated, regenerate schedule
            if (updateData.is_active === true && !updateData.is_active_was_true_before) {
                await this.regenerateSchedule(updatedPlan);
            }

            return updatedPlan;
        } catch (error) {
            console.error('Error updating feeding plan:', error);
            throw error;
        }
    }

    // Regenerate schedule for a plan
    static async regenerateSchedule(plan) {
        try {
            // Delete existing planned feedings
            await Feeding.destroy({
                where: {
                    feeding_plan_id: plan.id,
                    status: 'planned'
                }
            });

            // Generate new schedule
            await this.generateScheduledFeedings(plan);

            return true;
        } catch (error) {
            console.error('Error regenerating schedule:', error);
            throw error;
        }
    }

    // Deactivate feeding plan
    static async deactivateFeedingPlan(planId, userId) {
        try {
            const plan = await FeedingPlan.findOne({
                where: { id: planId, user_id: userId }
            });

            if (!plan) {
                return false;
            }

            await plan.update({ is_active: false });

            // Cancel all future planned feedings
            await Feeding.update(
                { status: 'cancelled' },
                {
                    where: {
                        feeding_plan_id: planId,
                        status: 'planned',
                        feeding_date: { [Op.gt]: new Date() }
                    }
                }
            );

            return true;
        } catch (error) {
            console.error('Error deactivating feeding plan:', error);
            throw error;
        }
    }

    // Delete feeding plan
    static async deleteFeedingPlan(planId, userId) {
        try {
            // Delete associated feedings first
            await Feeding.destroy({
                where: {
                    feeding_plan_id: planId,
                    status: 'planned'
                }
            });

            // Delete the plan
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

    // Generate feeding reminders
    static async generateFeedingReminders() {
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
                    const alert = await AlertService.createAlert({
                        user_id: feeding.user_id,
                        hive_id: feeding.hive_id,
                        apiary_id: feeding.apiary_id,
                        type: 'feeding_reminder',
                        priority: 'medium',
                        title: 'تذكير تغذية',
                        message: `تذكير: تغذية مجدولة غداً للخلية ${feeding.hive?.name} في المنحل ${feeding.hive?.apiary?.name}`,
                        metadata: {
                            feeding_id: feeding.id,
                            feeding_type: feeding.feeding_type,
                            feeding_date: feeding.feeding_date,
                            estimated_cost: feeding.total_cost
                        },
                        send_notification: true
                    });

                    reminders.push(alert);
                }
            }

            return reminders;
        } catch (error) {
            console.error('Error generating feeding reminders:', error);
            throw error;
        }
    }

    // Get feeding plan statistics
    static async getFeedingPlanStats(userId, planId = null) {
        try {
            const whereClause = { user_id: userId };
            if (planId) whereClause.id = planId;

            const plans = await FeedingPlan.findAll({
                where: whereClause,
                include: [{
                    model: Feeding,
                    as: 'feedings',
                    attributes: ['id', 'status', 'total_cost', 'feeding_date']
                }]
            });

            const stats = {
                total_plans: plans.length,
                active_plans: plans.filter(p => p.is_active).length,
                completed_plans: plans.filter(p => !p.is_active).length,
                total_scheduled_feedings: 0,
                completed_feedings: 0,
                pending_feedings: 0,
                total_estimated_cost: 0,
                actual_cost: 0,
                by_type: {},
                by_status: {}
            };

            plans.forEach(plan => {
                // Count by type
                if (!stats.by_type[plan.plan_type]) {
                    stats.by_type[plan.plan_type] = 0;
                }
                stats.by_type[plan.plan_type]++;

                // Process feedings
                if (plan.feedings) {
                    plan.feedings.forEach(feeding => {
                        stats.total_scheduled_feedings++;
                        stats.total_estimated_cost += parseFloat(feeding.total_cost) || 0;

                        if (feeding.status === 'completed') {
                            stats.completed_feedings++;
                            stats.actual_cost += parseFloat(feeding.total_cost) || 0;
                        } else if (feeding.status === 'planned') {
                            stats.pending_feedings++;
                        }

                        // Count by status
                        if (!stats.by_status[feeding.status]) {
                            stats.by_status[feeding.status] = 0;
                        }
                        stats.by_status[feeding.status]++;
                    });
                }
            });

            // Calculate efficiency
            stats.completion_rate = stats.total_scheduled_feedings > 0
                ? (stats.completed_feedings / stats.total_scheduled_feedings) * 100
                : 0;

            stats.cost_efficiency = stats.total_estimated_cost > 0
                ? (stats.actual_cost / stats.total_estimated_cost) * 100
                : 0;

            return stats;
        } catch (error) {
            console.error('Error getting feeding plan stats:', error);
            throw error;
        }
    }

    // Create feeding plan template
    static getFeedingPlanTemplates() {
        return {
            emergency_feeding: {
                name: 'تغذية طارئة',
                description: 'برنامج تغذية سريع للخلايا في حالة نقص حاد في الغذاء',
                plan_type: 'emergency',
                feeding_type: 'emergency_feeding',
                frequency_pattern: 'daily',
                frequency_days: 1,
                progression_type: 'decreasing',
                duration_days: 14,
                estimated_cost_per_feeding: 15.0,
                notes: 'تغذية يومية لمدة أسبوعين مع تقليل تدريجي'
            },
            spring_stimulation: {
                name: 'تحفيز الربيع',
                description: 'برنامج تغذية محفزة لبداية الموسم',
                plan_type: 'stimulative',
                feeding_type: 'stimulative_feeding',
                frequency_pattern: 'bi_weekly',
                frequency_days: 3,
                progression_type: 'increasing',
                duration_days: 45,
                estimated_cost_per_feeding: 8.0,
                notes: 'تغذية كل 3 أيام لمدة شهر ونصف مع زيادة تدريجية'
            },
            winter_preparation: {
                name: 'التحضير للشتاء',
                description: 'برنامج تغذية للتحضير لفصل الشتاء',
                plan_type: 'winter_prep',
                feeding_type: 'winter_feeding',
                frequency_pattern: 'weekly',
                frequency_days: 7,
                progression_type: 'constant',
                duration_days: 60,
                estimated_cost_per_feeding: 12.0,
                notes: 'تغذية أسبوعية لمدة شهرين بكميات ثابتة'
            },
            maintenance_program: {
                name: 'برنامج الصيانة',
                description: 'برنامج تغذية صيانة منتظم',
                plan_type: 'maintenance',
                feeding_type: 'maintenance_feeding',
                frequency_pattern: 'bi_weekly',
                frequency_days: 14,
                progression_type: 'seasonal',
                duration_days: 90,
                estimated_cost_per_feeding: 6.0,
                notes: 'تغذية كل أسبوعين مع تعديل موسمي'
            },
            protein_boost: {
                name: 'تعزيز البروتين',
                description: 'برنامج تغذية بروتينية لتحسين تربية الحضنة',
                plan_type: 'stimulative',
                feeding_type: 'protein_patty',
                frequency_pattern: 'weekly',
                frequency_days: 10,
                progression_type: 'constant',
                duration_days: 30,
                estimated_cost_per_feeding: 20.0,
                notes: 'تغذية بروتينية كل 10 أيام لمدة شهر'
            }
        };
    }
}

module.exports = FeedingPlanService;