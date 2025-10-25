const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const FeedingPlan = sequelize.define('FeedingPlan', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id'
            },
            onDelete: 'CASCADE'
        },
        name: {
            type: DataTypes.STRING(200),
            allowNull: false,
            comment: 'Name of the feeding plan'
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'Detailed description of the feeding plan'
        },
        plan_type: {
            type: DataTypes.ENUM(
                'emergency',
                'stimulative',
                'maintenance',
                'winter_prep',
                'spring_buildup',
                'seasonal',
                'custom'
            ),
            allowNull: false,
            defaultValue: 'custom'
        },
        primary_feeding_type: {
            type: DataTypes.ENUM(
                'sugar_syrup',
                'honey_syrup',
                'pollen_patty',
                'protein_patty',
                'emergency_feeding',
                'winter_feeding',
                'stimulative_feeding',
                'maintenance_feeding',
                'candy_board',
                'fondant'
            ),
            allowNull: false,
            defaultValue: 'sugar_syrup'
        },
        feeding_method: {
            type: DataTypes.ENUM(
                'top_feeder',
                'entrance_feeder',
                'boardman_feeder',
                'frame_feeder',
                'baggie_feeder',
                'patty_placement',
                'candy_board',
                'other'
            ),
            allowNull: false,
            defaultValue: 'top_feeder'
        },
        start_date: {
            type: DataTypes.DATE,
            allowNull: false,
            comment: 'Start date of the feeding plan'
        },
        end_date: {
            type: DataTypes.DATE,
            allowNull: false,
            comment: 'End date of the feeding plan'
        },
        season: {
            type: DataTypes.ENUM('spring', 'summer', 'autumn', 'winter'),
            allowNull: true,
            comment: 'Season for which this plan is designed'
        },
        target_hives: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Array of specific hive IDs to include in this plan'
        },
        target_apiaries: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Array of apiary IDs to include all hives from'
        },
        frequency_days: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 3,
            comment: 'Base frequency in days between feedings'
        },
        auto_adjust_frequency: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
            comment: 'Whether to automatically adjust frequency based on hive conditions'
        },
        auto_generate_schedule: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
            comment: 'Whether to automatically generate feeding schedule'
        },
        estimated_total_cost: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
            comment: 'Estimated total cost for the entire plan'
        },
        actual_total_cost: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
            defaultValue: 0.00,
            comment: 'Actual total cost spent on this plan'
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
            comment: 'Whether this plan is currently active'
        },
        is_recurring: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            comment: 'Whether this plan should repeat automatically'
        },
        recurrence_pattern: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Recurrence pattern configuration (weekly, monthly, seasonal, etc.)'
        },
        conditions: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Conditions that trigger plan execution (weather, hive status, etc.)'
        },
        notifications_enabled: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
            comment: 'Whether to send notifications for this plan'
        },
        reminder_days_before: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1,
            comment: 'How many days before feeding to send reminder'
        },
        completion_percentage: {
            type: DataTypes.DECIMAL(5, 2),
            allowNull: false,
            defaultValue: 0.00,
            comment: 'Percentage of plan completion'
        },
        last_executed_date: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: 'Last date when a feeding from this plan was executed'
        },
        next_execution_date: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: 'Next scheduled execution date'
        },
        created_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        },
        updated_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        }
    }, {
        tableName: 'feeding_plans',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        indexes: [
            {
                fields: ['user_id']
            },
            {
                fields: ['plan_type']
            },
            {
                fields: ['is_active']
            },
            {
                fields: ['start_date']
            },
            {
                fields: ['end_date']
            },
            {
                fields: ['season']
            },
            {
                fields: ['user_id', 'is_active']
            },
            {
                fields: ['user_id', 'plan_type', 'is_active']
            }
        ]
    });

    // Instance methods
    FeedingPlan.prototype.getDurationInDays = function () {
        const start = new Date(this.start_date);
        const end = new Date(this.end_date);
        return Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    };

    FeedingPlan.prototype.getEstimatedFeedingCount = function () {
        const duration = this.getDurationInDays();
        return Math.ceil(duration / (this.frequency_days || 3));
    };

    FeedingPlan.prototype.isExpired = function () {
        return new Date() > new Date(this.end_date);
    };

    FeedingPlan.prototype.isStarted = function () {
        return new Date() >= new Date(this.start_date);
    };

    FeedingPlan.prototype.getDaysUntilStart = function () {
        const now = new Date();
        const start = new Date(this.start_date);
        if (start <= now) return 0;
        return Math.ceil((start - now) / (1000 * 60 * 60 * 24));
    };

    FeedingPlan.prototype.getDaysUntilEnd = function () {
        const now = new Date();
        const end = new Date(this.end_date);
        if (end <= now) return 0;
        return Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    };

    FeedingPlan.prototype.updateCompletionPercentage = async function () {
        try {
            const { Feeding } = require('./index');

            const totalFeedings = await Feeding.count({
                where: { plan_id: this.id }
            });

            const completedFeedings = await Feeding.count({
                where: {
                    plan_id: this.id,
                    status: 'completed'
                }
            });

            const percentage = totalFeedings > 0 ? (completedFeedings / totalFeedings) * 100 : 0;

            await this.update({ completion_percentage: percentage });
            return percentage;
        } catch (error) {
            console.error('Error updating completion percentage:', error);
            return this.completion_percentage;
        }
    };

    FeedingPlan.prototype.calculateActualCost = async function () {
        try {
            const { Feeding } = require('./index');

            const result = await Feeding.findOne({
                where: { plan_id: this.id },
                attributes: [
                    [Feeding.sequelize.fn('SUM', Feeding.sequelize.col('total_cost')), 'total']
                ],
                raw: true
            });

            const actualCost = parseFloat(result.total) || 0;
            await this.update({ actual_total_cost: actualCost });
            return actualCost;
        } catch (error) {
            console.error('Error calculating actual cost:', error);
            return this.actual_total_cost;
        }
    };

    FeedingPlan.prototype.getTargetHiveCount = function () {
        let count = 0;

        if (this.target_hives && Array.isArray(this.target_hives)) {
            count += this.target_hives.length;
        }

        // Note: For apiaries, we'd need to query the actual hive count
        // This is a simplified version
        if (this.target_apiaries && Array.isArray(this.target_apiaries)) {
            count += this.target_apiaries.length * 10; // Estimate 10 hives per apiary
        }

        return count;
    };

    FeedingPlan.prototype.getPlanTypeLabel = function () {
        const labels = {
            emergency: 'طارئة',
            stimulative: 'محفزة',
            maintenance: 'صيانة',
            winter_prep: 'تحضير شتوي',
            spring_buildup: 'بناء ربيعي',
            seasonal: 'موسمية',
            custom: 'مخصصة'
        };
        return labels[this.plan_type] || this.plan_type;
    };

    FeedingPlan.prototype.getPrimaryFeedingTypeLabel = function () {
        const labels = {
            sugar_syrup: 'محلول سكري',
            honey_syrup: 'محلول عسل',
            pollen_patty: 'عجينة حبوب لقاح',
            protein_patty: 'عجينة بروتين',
            emergency_feeding: 'تغذية طارئة',
            winter_feeding: 'تغذية شتوية',
            stimulative_feeding: 'تغذية محفزة',
            maintenance_feeding: 'تغذية صيانة',
            candy_board: 'لوح حلوى',
            fondant: 'فوندان'
        };
        return labels[this.primary_feeding_type] || this.primary_feeding_type;
    };

    FeedingPlan.prototype.getSeasonLabel = function () {
        const labels = {
            spring: 'الربيع',
            summer: 'الصيف',
            autumn: 'الخريف',
            winter: 'الشتاء'
        };
        return labels[this.season] || this.season;
    };

    FeedingPlan.prototype.getStatusLabel = function () {
        if (!this.is_active) return 'معطل';
        if (this.isExpired()) return 'منتهي';
        if (!this.isStarted()) return 'لم يبدأ';
        return 'نشط';
    };

    FeedingPlan.prototype.getStatusColor = function () {
        if (!this.is_active) return 'gray';
        if (this.isExpired()) return 'danger';
        if (!this.isStarted()) return 'warning';
        return 'success';
    };

    // Class methods
    FeedingPlan.getActivePlans = async function (userId) {
        return await this.findAll({
            where: {
                user_id: userId,
                is_active: true,
                end_date: { [sequelize.Sequelize.Op.gte]: new Date() }
            },
            order: [['start_date', 'ASC']]
        });
    };

    FeedingPlan.getExpiredPlans = async function (userId) {
        return await this.findAll({
            where: {
                user_id: userId,
                end_date: { [sequelize.Sequelize.Op.lt]: new Date() }
            },
            order: [['end_date', 'DESC']]
        });
    };

    FeedingPlan.getUpcomingPlans = async function (userId, days = 7) {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + days);

        return await this.findAll({
            where: {
                user_id: userId,
                is_active: true,
                start_date: {
                    [sequelize.Sequelize.Op.between]: [new Date(), futureDate]
                }
            },
            order: [['start_date', 'ASC']]
        });
    };

    FeedingPlan.getPlansByType = async function (userId, planType) {
        return await this.findAll({
            where: {
                user_id: userId,
                plan_type: planType
            },
            order: [['created_at', 'DESC']]
        });
    };

    FeedingPlan.getPlansBySeason = async function (userId, season) {
        return await this.findAll({
            where: {
                user_id: userId,
                season: season
            },
            order: [['start_date', 'ASC']]
        });
    };

    return FeedingPlan;
};