const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Feeding = sequelize.define('Feeding', {
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
        hive_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'hives',
                key: 'id'
            },
            onDelete: 'CASCADE'
        },
        apiary_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'apiaries',
                key: 'id'
            },
            onDelete: 'CASCADE'
        },
        feeding_type: {
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
                'fondant',
                'custom'
            ),
            allowNull: false,
            defaultValue: 'sugar_syrup'
        },
        feeding_date: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        },
        recipe_name: {
            type: DataTypes.STRING(100),
            allowNull: true,
            comment: 'Name of the recipe used'
        },
        ingredients: {
            type: DataTypes.JSON,
            allowNull: false,
            comment: 'Ingredients and amounts used (e.g., {sugar: 1000, water: 1000})'
        },
        total_amount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
            comment: 'Total amount prepared in grams or ml'
        },
        amount_consumed: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
            comment: 'Amount actually consumed by bees'
        },
        total_cost: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0.00,
            comment: 'Total cost in SAR'
        },
        cost_per_unit: {
            type: DataTypes.DECIMAL(10, 4),
            allowNull: true,
            comment: 'Cost per gram or ml'
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
        weather_conditions: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Weather during feeding (temperature, humidity, etc.)'
        },
        hive_condition_before: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Hive condition before feeding (population, food stores, etc.)'
        },
        hive_condition_after: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Hive condition after feeding (if assessed)'
        },
        consumption_rate: {
            type: DataTypes.ENUM('none', 'slow', 'moderate', 'fast', 'very_fast'),
            allowNull: true,
            comment: 'How quickly bees consumed the food'
        },
        bee_response: {
            type: DataTypes.ENUM('positive', 'neutral', 'negative', 'aggressive'),
            allowNull: true,
            comment: 'Bee behavior response to feeding'
        },
        effectiveness: {
            type: DataTypes.INTEGER,
            allowNull: true,
            validate: {
                min: 1,
                max: 10
            },
            comment: 'Effectiveness rating from 1-10'
        },
        notes: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'Additional notes about the feeding'
        },
        next_feeding_date: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: 'Planned date for next feeding'
        },
        status: {
            type: DataTypes.ENUM('planned', 'completed', 'partially_consumed', 'rejected', 'cancelled'),
            allowNull: false,
            defaultValue: 'planned'
        },
        batch_id: {
            type: DataTypes.STRING(50),
            allowNull: true,
            comment: 'ID for bulk feeding operations'
        },
        feeding_duration_hours: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: 'How long the feeding was available'
        },
        temperature_during_feeding: {
            type: DataTypes.DECIMAL(5, 2),
            allowNull: true,
            comment: 'Temperature during feeding in Celsius'
        },
        humidity_during_feeding: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: 'Humidity percentage during feeding'
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
        tableName: 'feedings',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        indexes: [
            {
                fields: ['user_id']
            },
            {
                fields: ['hive_id']
            },
            {
                fields: ['apiary_id']
            },
            {
                fields: ['feeding_type']
            },
            {
                fields: ['feeding_date']
            },
            {
                fields: ['status']
            },
            {
                fields: ['batch_id']
            },
            {
                fields: ['user_id', 'feeding_date']
            },
            {
                fields: ['hive_id', 'feeding_date']
            },
            {
                fields: ['user_id', 'feeding_type', 'status']
            }
        ]
    });

    // Instance methods
    Feeding.prototype.calculateEfficiency = function () {
        if (!this.total_amount || !this.amount_consumed) {
            return null;
        }
        return Math.round((this.amount_consumed / this.total_amount) * 100);
    };

    Feeding.prototype.getCostPerGram = function () {
        if (!this.total_amount || this.total_amount === 0) {
            return 0;
        }
        return this.total_cost / this.total_amount;
    };

    Feeding.prototype.getDaysUntilNextFeeding = function () {
        if (!this.next_feeding_date) {
            return null;
        }
        const now = new Date();
        const nextFeeding = new Date(this.next_feeding_date);
        const diffTime = nextFeeding - now;
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    Feeding.prototype.getConsumptionRateScore = function () {
        const scores = {
            none: 0,
            slow: 2,
            moderate: 5,
            fast: 8,
            very_fast: 10
        };
        return scores[this.consumption_rate] || 0;
    };

    Feeding.prototype.getBeeResponseScore = function () {
        const scores = {
            positive: 10,
            neutral: 5,
            negative: 2,
            aggressive: 0
        };
        return scores[this.bee_response] || 5;
    };

    Feeding.prototype.getOverallScore = function () {
        const consumptionScore = this.getConsumptionRateScore();
        const responseScore = this.getBeeResponseScore();
        const effectivenessScore = this.effectiveness || 5;

        return Math.round((consumptionScore + responseScore + effectivenessScore) / 3);
    };

    Feeding.prototype.isOverdue = function () {
        if (!this.next_feeding_date) {
            return false;
        }
        return new Date() > new Date(this.next_feeding_date);
    };

    Feeding.prototype.getIngredientsList = function () {
        if (!this.ingredients) {
            return [];
        }

        return Object.keys(this.ingredients).map(ingredient => ({
            name: ingredient,
            amount: this.ingredients[ingredient],
            unit: this.getIngredientUnit(ingredient)
        }));
    };

    Feeding.prototype.getIngredientUnit = function (ingredient) {
        const units = {
            sugar: 'جرام',
            water: 'مل',
            honey: 'جرام',
            pollen: 'جرام',
            soy_flour: 'جرام',
            yeast: 'جرام'
        };
        return units[ingredient] || 'جرام';
    };

    Feeding.prototype.getFeedingTypeLabel = function () {
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
            fondant: 'فوندان',
            custom: 'مخصص'
        };
        return labels[this.feeding_type] || this.feeding_type;
    };

    Feeding.prototype.getFeedingMethodLabel = function () {
        const labels = {
            top_feeder: 'غذاية علوية',
            entrance_feeder: 'غذاية مدخل',
            boardman_feeder: 'غذاية بوردمان',
            frame_feeder: 'غذاية إطار',
            baggie_feeder: 'غذاية كيس',
            patty_placement: 'وضع عجينة',
            candy_board: 'لوح حلوى',
            other: 'أخرى'
        };
        return labels[this.feeding_method] || this.feeding_method;
    };

    Feeding.prototype.getStatusLabel = function () {
        const labels = {
            planned: 'مخطط',
            completed: 'مكتمل',
            partially_consumed: 'مستهلك جزئياً',
            rejected: 'مرفوض',
            cancelled: 'ملغي'
        };
        return labels[this.status] || this.status;
    };

    // Class methods
    Feeding.getTotalCostByUser = async function (userId, dateFrom, dateTo) {
        const whereClause = { user_id: userId };

        if (dateFrom || dateTo) {
            whereClause.feeding_date = {};
            if (dateFrom) whereClause.feeding_date[sequelize.Sequelize.Op.gte] = dateFrom;
            if (dateTo) whereClause.feeding_date[sequelize.Sequelize.Op.lte] = dateTo;
        }

        const result = await this.findOne({
            where: whereClause,
            attributes: [
                [sequelize.Sequelize.fn('SUM', sequelize.Sequelize.col('total_cost')), 'total']
            ],
            raw: true
        });

        return parseFloat(result.total) || 0;
    };

    Feeding.getAverageEffectiveness = async function (userId, feedingType = null) {
        const whereClause = {
            user_id: userId,
            effectiveness: { [sequelize.Sequelize.Op.not]: null }
        };

        if (feedingType) {
            whereClause.feeding_type = feedingType;
        }

        const result = await this.findOne({
            where: whereClause,
            attributes: [
                [sequelize.Sequelize.fn('AVG', sequelize.Sequelize.col('effectiveness')), 'average']
            ],
            raw: true
        });

        return parseFloat(result.average) || 0;
    };

    Feeding.getMostUsedType = async function (userId) {
        const results = await this.findAll({
            where: { user_id: userId },
            attributes: [
                'feeding_type',
                [sequelize.Sequelize.fn('COUNT', sequelize.Sequelize.col('id')), 'count']
            ],
            group: ['feeding_type'],
            order: [[sequelize.Sequelize.literal('count'), 'DESC']],
            limit: 1,
            raw: true
        });

        return results.length > 0 ? results[0].feeding_type : null;
    };

    Feeding.getUpcomingFeedings = async function (userId, days = 7) {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + days);

        return await this.findAll({
            where: {
                user_id: userId,
                next_feeding_date: {
                    [sequelize.Sequelize.Op.between]: [new Date(), futureDate]
                },
                status: ['planned', 'completed']
            },
            order: [['next_feeding_date', 'ASC']]
        });
    };

    Feeding.getOverdueFeedings = async function (userId) {
        return await this.findAll({
            where: {
                user_id: userId,
                next_feeding_date: {
                    [sequelize.Sequelize.Op.lt]: new Date()
                },
                status: 'planned'
            },
            order: [['next_feeding_date', 'ASC']]
        });
    };

    return Feeding;
};