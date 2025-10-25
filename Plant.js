const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Plant = sequelize.define('Plant', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        name_arabic: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        name_scientific: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        name_english: {
            type: DataTypes.STRING(100),
            allowNull: true
        },
        local_names: {
            type: DataTypes.ARRAY(DataTypes.STRING),
            defaultValue: [],
            comment: 'Local/regional names for the plant'
        },
        family: {
            type: DataTypes.STRING(100),
            allowNull: true,
            comment: 'Plant family (e.g., Rosaceae, Fabaceae)'
        },
        type: {
            type: DataTypes.ENUM('tree', 'shrub', 'herb', 'grass', 'vine', 'crop'),
            allowNull: false
        },
        flowering_period: {
            type: DataTypes.JSONB,
            allowNull: false,
            validate: {
                hasValidPeriod(value) {
                    if (!value.start_month || !value.end_month) {
                        throw new Error('Flowering period must include start_month and end_month');
                    }
                    if (value.start_month < 1 || value.start_month > 12 ||
                        value.end_month < 1 || value.end_month > 12) {
                        throw new Error('Months must be between 1 and 12');
                    }
                }
            }
        },
        nectar_production: {
            type: DataTypes.ENUM('none', 'low', 'medium', 'high', 'excellent'),
            defaultValue: 'medium'
        },
        pollen_production: {
            type: DataTypes.ENUM('none', 'low', 'medium', 'high', 'excellent'),
            defaultValue: 'medium'
        },
        honey_characteristics: {
            type: DataTypes.JSONB,
            defaultValue: {},
            comment: 'Color, taste, crystallization properties of honey from this plant'
        },
        geographical_distribution: {
            type: DataTypes.ARRAY(DataTypes.STRING),
            defaultValue: [],
            comment: 'Countries/regions where this plant is found'
        },
        climate_requirements: {
            type: DataTypes.JSONB,
            defaultValue: {},
            comment: 'Temperature, rainfall, soil requirements'
        },
        cultivation_info: {
            type: DataTypes.JSONB,
            defaultValue: {},
            comment: 'Planting season, care instructions, yield information'
        },
        bee_attractiveness: {
            type: DataTypes.INTEGER,
            allowNull: true,
            validate: {
                min: 1,
                max: 10
            },
            comment: 'Rating from 1-10 of how attractive this plant is to bees'
        },
        bloom_duration: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: 'Duration of blooming period in days'
        },
        daily_nectar_flow: {
            type: DataTypes.ENUM('morning', 'afternoon', 'evening', 'all_day', 'variable'),
            defaultValue: 'all_day'
        },
        companion_plants: {
            type: DataTypes.ARRAY(DataTypes.UUID),
            defaultValue: [],
            comment: 'IDs of plants that bloom at the same time or grow well together'
        },
        photos: {
            type: DataTypes.ARRAY(DataTypes.STRING),
            defaultValue: []
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        beekeeping_notes: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'Special notes for beekeepers about this plant'
        },
        is_verified: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            comment: 'Whether the plant information has been verified by experts'
        },
        contributor_id: {
            type: DataTypes.UUID,
            allowNull: true,
            references: {
                model: 'users',
                key: 'id'
            },
            comment: 'User who contributed this plant information'
        },
        verification_date: {
            type: DataTypes.DATE,
            allowNull: true
        },
        usage_count: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            comment: 'How many beekeepers have selected this plant'
        }
    }, {
        tableName: 'plants',
        indexes: [
            {
                fields: ['name_arabic']
            },
            {
                fields: ['name_scientific']
            },
            {
                fields: ['type']
            },
            {
                fields: ['nectar_production']
            },
            {
                fields: ['pollen_production']
            },
            {
                fields: ['is_verified']
            },
            {
                fields: ['bee_attractiveness']
            },
            {
                name: 'plant_flowering_period_gin',
                fields: ['flowering_period'],
                using: 'gin'
            }
        ]
    });

    Plant.associate = (models) => {
        Plant.belongsTo(models.User, {
            foreignKey: 'contributor_id',
            as: 'contributor'
        });
    };

    // Class methods
    Plant.findByFloweringMonth = async (month) => {
        return await Plant.findAll({
            where: sequelize.literal(`
        (flowering_period->>'start_month')::int <= ${month} AND 
        (flowering_period->>'end_month')::int >= ${month}
      `),
            order: [['bee_attractiveness', 'DESC'], ['nectar_production', 'DESC']]
        });
    };

    Plant.findByRegion = async (region) => {
        return await Plant.findAll({
            where: {
                geographical_distribution: {
                    [sequelize.Op.contains]: [region]
                }
            },
            order: [['usage_count', 'DESC']]
        });
    };

    Plant.searchPlants = async (searchTerm) => {
        return await Plant.findAll({
            where: {
                [sequelize.Op.or]: [
                    { name_arabic: { [sequelize.Op.iLike]: `%${searchTerm}%` } },
                    { name_scientific: { [sequelize.Op.iLike]: `%${searchTerm}%` } },
                    { name_english: { [sequelize.Op.iLike]: `%${searchTerm}%` } },
                    { local_names: { [sequelize.Op.contains]: [searchTerm] } }
                ]
            },
            order: [['usage_count', 'DESC'], ['bee_attractiveness', 'DESC']]
        });
    };

    // Instance methods
    Plant.prototype.isFloweringInMonth = function (month) {
        const start = this.flowering_period.start_month;
        const end = this.flowering_period.end_month;

        // Handle cases where flowering period crosses year boundary
        if (start <= end) {
            return month >= start && month <= end;
        } else {
            return month >= start || month <= end;
        }
    };

    Plant.prototype.getFloweringMonths = function () {
        const start = this.flowering_period.start_month;
        const end = this.flowering_period.end_month;
        const months = [];

        if (start <= end) {
            for (let i = start; i <= end; i++) {
                months.push(i);
            }
        } else {
            // Crosses year boundary
            for (let i = start; i <= 12; i++) {
                months.push(i);
            }
            for (let i = 1; i <= end; i++) {
                months.push(i);
            }
        }

        return months;
    };

    Plant.prototype.getMonthName = function (month, language = 'ar') {
        const monthNames = {
            ar: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
                'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
            en: ['January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December']
        };

        return monthNames[language][month - 1];
    };

    Plant.prototype.getFloweringPeriodText = function (language = 'ar') {
        const start = this.getMonthName(this.flowering_period.start_month, language);
        const end = this.getMonthName(this.flowering_period.end_month, language);

        if (this.flowering_period.start_month === this.flowering_period.end_month) {
            return start;
        }

        return `${start} - ${end}`;
    };

    Plant.prototype.getBeeValue = function () {
        const nectarScore = {
            'none': 0, 'low': 1, 'medium': 2, 'high': 3, 'excellent': 4
        };
        const pollenScore = {
            'none': 0, 'low': 1, 'medium': 2, 'high': 3, 'excellent': 4
        };

        const nectar = nectarScore[this.nectar_production] || 0;
        const pollen = pollenScore[this.pollen_production] || 0;
        const attractiveness = (this.bee_attractiveness || 5) / 2;

        return Math.round((nectar + pollen + attractiveness) / 3 * 10) / 10;
    };

    Plant.prototype.incrementUsage = async function () {
        return await this.update({
            usage_count: this.usage_count + 1
        });
    };

    Plant.prototype.getHoneyColor = function () {
        return this.honey_characteristics?.color || 'متغير';
    };

    Plant.prototype.getHoneyTaste = function () {
        return this.honey_characteristics?.taste || 'متغير';
    };

    return Plant;
};