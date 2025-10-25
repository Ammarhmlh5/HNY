const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const HoneyProduction = sequelize.define('HoneyProduction', {
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
        harvest_date: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        },
        honey_type: {
            type: DataTypes.ENUM(
                'wildflower',     // زهور برية
                'acacia',         // سدر
                'citrus',         // حمضيات
                'clover',         // برسيم
                'eucalyptus',     // كافور
                'manuka',         // مانوكا
                'lavender',       // خزامى
                'sunflower',      // عباد الشمس
                'mixed_floral',   // أزهار مختلطة
                'forest',         // غابات
                'mountain',       // جبلي
                'desert',         // صحراوي
                'spring',         // ربيعي
                'summer',         // صيفي
                'autumn',         // خريفي
                'custom'          // مخصص
            ),
            allowNull: false,
            defaultValue: 'wildflower'
        },
        honey_source: {
            type: DataTypes.STRING(200),
            allowNull: true,
            comment: 'Source description (e.g., specific flowers, location)'
        },
        quantity_kg: {
            type: DataTypes.DECIMAL(10, 3),
            allowNull: false,
            validate: {
                min: 0
            },
            comment: 'Total quantity harvested in kilograms'
        },
        quality_grade: {
            type: DataTypes.ENUM('premium', 'grade_a', 'grade_b', 'grade_c', 'ungraded'),
            allowNull: false,
            defaultValue: 'ungraded'
        },
        moisture_content: {
            type: DataTypes.DECIMAL(5, 2),
            allowNull: true,
            validate: {
                min: 0,
                max: 100
            },
            comment: 'Moisture percentage'
        },
        color_grade: {
            type: DataTypes.ENUM(
                'extra_light_amber',  // كهرماني فاتح جداً
                'light_amber',        // كهرماني فاتح
                'medium_amber',       // كهرماني متوسط
                'dark_amber',         // كهرماني داكن
                'extra_dark_amber'    // كهرماني داكن جداً
            ),
            allowNull: true
        },
        taste_profile: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Taste characteristics (sweetness, floral notes, etc.)'
        },
        processing_method: {
            type: DataTypes.ENUM(
                'raw_unfiltered',     // خام غير مفلتر
                'raw_filtered',       // خام مفلتر
                'pasteurized',        // مبستر
                'creamed',            // كريمي
                'chunk_honey'         // عسل بالشمع
            ),
            allowNull: false,
            defaultValue: 'raw_filtered'
        },
        extraction_method: {
            type: DataTypes.ENUM(
                'centrifugal',        // طرد مركزي
                'crush_strain',       // عصر وتصفية
                'gravity_drain',      // تصفية بالجاذبية
                'cut_comb'           // قطع الشمع
            ),
            allowNull: false,
            defaultValue: 'centrifugal'
        },
        frames_harvested: {
            type: DataTypes.INTEGER,
            allowNull: true,
            validate: {
                min: 0
            }
        },
        supers_harvested: {
            type: DataTypes.INTEGER,
            allowNull: true,
            validate: {
                min: 0
            }
        },
        wax_recovered_kg: {
            type: DataTypes.DECIMAL(8, 3),
            allowNull: true,
            validate: {
                min: 0
            },
            comment: 'Amount of beeswax recovered during extraction'
        },
        storage_location: {
            type: DataTypes.STRING(200),
            allowNull: true
        },
        storage_conditions: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Temperature, humidity, light conditions'
        },
        packaging_info: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Container types, sizes, labels used'
        },
        batch_number: {
            type: DataTypes.STRING(50),
            allowNull: true,
            unique: true
        },
        harvest_notes: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        weather_conditions: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Weather during harvest'
        },
        estimated_value: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
            comment: 'Estimated market value in SAR'
        },
        actual_sale_value: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
            comment: 'Actual sale value if sold'
        },
        cost_of_production: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
            comment: 'Total cost of production including feeding, equipment, labor'
        },
        profit_margin: {
            type: DataTypes.DECIMAL(5, 2),
            allowNull: true,
            comment: 'Profit margin percentage'
        },
        harvest_season: {
            type: DataTypes.ENUM('spring', 'summer', 'autumn', 'winter'),
            allowNull: true
        },
        nectar_flow_period: {
            type: DataTypes.STRING(100),
            allowNull: true,
            comment: 'Description of nectar flow period'
        },
        lab_test_results: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Laboratory test results (purity, antibiotics, etc.)'
        },
        certification: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Organic, halal, or other certifications'
        },
        status: {
            type: DataTypes.ENUM(
                'harvested',          // تم القطف
                'processing',         // قيد المعالجة
                'stored',            // مخزن
                'packaged',          // معبأ
                'sold',              // مباع
                'consumed'           // مستهلك
            ),
            allowNull: false,
            defaultValue: 'harvested'
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
        tableName: 'honey_productions',
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
                fields: ['harvest_date']
            },
            {
                fields: ['honey_type']
            },
            {
                fields: ['quality_grade']
            },
            {
                fields: ['status']
            },
            {
                fields: ['batch_number']
            },
            {
                fields: ['harvest_season']
            },
            {
                fields: ['user_id', 'harvest_date']
            },
            {
                fields: ['user_id', 'honey_type', 'status']
            }
        ]
    });

    // Instance methods
    HoneyProduction.prototype.calculateYieldPerFrame = function () {
        if (!this.frames_harvested || this.frames_harvested === 0) {
            return 0;
        }
        return this.quantity_kg / this.frames_harvested;
    };

    HoneyProduction.prototype.calculateYieldPerSuper = function () {
        if (!this.supers_harvested || this.supers_harvested === 0) {
            return 0;
        }
        return this.quantity_kg / this.supers_harvested;
    };

    HoneyProduction.prototype.calculateProfitMargin = function () {
        if (!this.actual_sale_value || !this.cost_of_production) {
            return null;
        }
        return ((this.actual_sale_value - this.cost_of_production) / this.actual_sale_value) * 100;
    };

    HoneyProduction.prototype.getQualityScore = function () {
        let score = 0;

        // Quality grade scoring
        const gradeScores = {
            premium: 100,
            grade_a: 85,
            grade_b: 70,
            grade_c: 55,
            ungraded: 50
        };
        score += gradeScores[this.quality_grade] || 50;

        // Moisture content scoring (lower is better)
        if (this.moisture_content) {
            if (this.moisture_content <= 18) score += 20;
            else if (this.moisture_content <= 20) score += 15;
            else if (this.moisture_content <= 22) score += 10;
            else score += 5;
        }

        return Math.min(100, score);
    };

    HoneyProduction.prototype.getHoneyTypeLabel = function () {
        const labels = {
            wildflower: 'زهور برية',
            acacia: 'سدر',
            citrus: 'حمضيات',
            clover: 'برسيم',
            eucalyptus: 'كافور',
            manuka: 'مانوكا',
            lavender: 'خزامى',
            sunflower: 'عباد الشمس',
            mixed_floral: 'أزهار مختلطة',
            forest: 'غابات',
            mountain: 'جبلي',
            desert: 'صحراوي',
            spring: 'ربيعي',
            summer: 'صيفي',
            autumn: 'خريفي',
            custom: 'مخصص'
        };
        return labels[this.honey_type] || this.honey_type;
    };

    HoneyProduction.prototype.getColorGradeLabel = function () {
        const labels = {
            extra_light_amber: 'كهرماني فاتح جداً',
            light_amber: 'كهرماني فاتح',
            medium_amber: 'كهرماني متوسط',
            dark_amber: 'كهرماني داكن',
            extra_dark_amber: 'كهرماني داكن جداً'
        };
        return labels[this.color_grade] || this.color_grade;
    };

    HoneyProduction.prototype.getQualityGradeLabel = function () {
        const labels = {
            premium: 'ممتاز',
            grade_a: 'درجة أولى',
            grade_b: 'درجة ثانية',
            grade_c: 'درجة ثالثة',
            ungraded: 'غير مصنف'
        };
        return labels[this.quality_grade] || this.quality_grade;
    };

    HoneyProduction.prototype.getStatusLabel = function () {
        const labels = {
            harvested: 'تم القطف',
            processing: 'قيد المعالجة',
            stored: 'مخزن',
            packaged: 'معبأ',
            sold: 'مباع',
            consumed: 'مستهلك'
        };
        return labels[this.status] || this.status;
    };

    HoneyProduction.prototype.getProcessingMethodLabel = function () {
        const labels = {
            raw_unfiltered: 'خام غير مفلتر',
            raw_filtered: 'خام مفلتر',
            pasteurized: 'مبستر',
            creamed: 'كريمي',
            chunk_honey: 'عسل بالشمع'
        };
        return labels[this.processing_method] || this.processing_method;
    };

    HoneyProduction.prototype.isHighQuality = function () {
        return this.quality_grade === 'premium' || this.quality_grade === 'grade_a';
    };

    HoneyProduction.prototype.needsQualityTest = function () {
        return this.quality_grade === 'ungraded' || !this.moisture_content;
    };

    HoneyProduction.prototype.getStorageRecommendations = function () {
        const recommendations = [];

        if (this.moisture_content > 20) {
            recommendations.push('محتوى الرطوبة مرتفع - احفظ في مكان جاف جداً');
        }

        if (this.honey_type === 'acacia') {
            recommendations.push('عسل السدر - احفظ في درجة حرارة معتدلة لمنع التبلور');
        }

        if (this.processing_method === 'raw_unfiltered') {
            recommendations.push('عسل خام - تجنب التعرض للحرارة العالية');
        }

        recommendations.push('احفظ في مكان مظلم وجاف');
        recommendations.push('استخدم عبوات محكمة الإغلاق');

        return recommendations;
    };

    // Class methods
    HoneyProduction.getTotalProduction = async function (userId, dateFrom, dateTo) {
        const whereClause = { user_id: userId };

        if (dateFrom || dateTo) {
            whereClause.harvest_date = {};
            if (dateFrom) whereClause.harvest_date[sequelize.Sequelize.Op.gte] = dateFrom;
            if (dateTo) whereClause.harvest_date[sequelize.Sequelize.Op.lte] = dateTo;
        }

        const result = await this.findOne({
            where: whereClause,
            attributes: [
                [sequelize.Sequelize.fn('SUM', sequelize.Sequelize.col('quantity_kg')), 'total_kg'],
                [sequelize.Sequelize.fn('SUM', sequelize.Sequelize.col('estimated_value')), 'total_value'],
                [sequelize.Sequelize.fn('COUNT', sequelize.Sequelize.col('id')), 'total_harvests']
            ],
            raw: true
        });

        return {
            total_kg: parseFloat(result.total_kg) || 0,
            total_value: parseFloat(result.total_value) || 0,
            total_harvests: parseInt(result.total_harvests) || 0
        };
    };

    HoneyProduction.getProductionByType = async function (userId, dateFrom, dateTo) {
        const whereClause = { user_id: userId };

        if (dateFrom || dateTo) {
            whereClause.harvest_date = {};
            if (dateFrom) whereClause.harvest_date[sequelize.Sequelize.Op.gte] = dateFrom;
            if (dateTo) whereClause.harvest_date[sequelize.Sequelize.Op.lte] = dateTo;
        }

        return await this.findAll({
            where: whereClause,
            attributes: [
                'honey_type',
                [sequelize.Sequelize.fn('SUM', sequelize.Sequelize.col('quantity_kg')), 'total_kg'],
                [sequelize.Sequelize.fn('AVG', sequelize.Sequelize.col('estimated_value')), 'avg_value'],
                [sequelize.Sequelize.fn('COUNT', sequelize.Sequelize.col('id')), 'harvest_count']
            ],
            group: ['honey_type'],
            raw: true
        });
    };

    HoneyProduction.getAverageYield = async function (userId, hiveId = null) {
        const whereClause = { user_id: userId };
        if (hiveId) whereClause.hive_id = hiveId;

        const result = await this.findOne({
            where: {
                ...whereClause,
                frames_harvested: { [sequelize.Sequelize.Op.not]: null }
            },
            attributes: [
                [sequelize.Sequelize.fn('AVG', sequelize.Sequelize.col('quantity_kg')), 'avg_total'],
                [sequelize.Sequelize.fn('AVG',
                    sequelize.Sequelize.literal('quantity_kg / NULLIF(frames_harvested, 0)')
                ), 'avg_per_frame']
            ],
            raw: true
        });

        return {
            avg_total_kg: parseFloat(result.avg_total) || 0,
            avg_per_frame_kg: parseFloat(result.avg_per_frame) || 0
        };
    };

    HoneyProduction.getTopPerformingHives = async function (userId, limit = 5) {
        return await this.findAll({
            where: { user_id: userId },
            attributes: [
                'hive_id',
                [sequelize.Sequelize.fn('SUM', sequelize.Sequelize.col('quantity_kg')), 'total_production'],
                [sequelize.Sequelize.fn('COUNT', sequelize.Sequelize.col('id')), 'harvest_count'],
                [sequelize.Sequelize.fn('AVG', sequelize.Sequelize.col('quality_grade')), 'avg_quality']
            ],
            group: ['hive_id'],
            order: [[sequelize.Sequelize.literal('total_production'), 'DESC']],
            limit: limit,
            raw: true
        });
    };

    return HoneyProduction;
};