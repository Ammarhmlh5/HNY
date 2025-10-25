const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Inspection = sequelize.define('Inspection', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        hive_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'hives',
                key: 'id'
            }
        },
        inspector_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id'
            }
        },
        inspection_date: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        },
        inspection_type: {
            type: DataTypes.ENUM('routine', 'disease_check', 'harvest', 'feeding', 'treatment', 'emergency'),
            allowNull: false,
            defaultValue: 'routine'
        },
        weather_conditions: {
            type: DataTypes.JSONB,
            defaultValue: {},
            comment: 'Weather during inspection: temperature, humidity, wind, etc.'
        },

        // الأسئلة الخمسة الأساسية للفحص السريع
        queen_present: {
            type: DataTypes.ENUM('yes', 'no', 'not_seen', 'unknown'),
            allowNull: true,
            comment: 'هل الملكة موجودة؟'
        },
        queen_laying: {
            type: DataTypes.ENUM('yes', 'no', 'poor', 'unknown'),
            allowNull: true,
            comment: 'هل الملكة تبيض؟'
        },
        brood_pattern: {
            type: DataTypes.ENUM('excellent', 'good', 'fair', 'poor', 'none'),
            allowNull: true,
            comment: 'نمط الحضنة'
        },
        population_strength: {
            type: DataTypes.ENUM('very_strong', 'strong', 'moderate', 'weak', 'very_weak'),
            allowNull: true,
            comment: 'قوة الطائفة'
        },
        food_stores: {
            type: DataTypes.ENUM('abundant', 'adequate', 'low', 'critical', 'none'),
            allowNull: true,
            comment: 'مخزون الغذاء'
        },

        // تفاصيل الفحص المتقدم
        queen_details: {
            type: DataTypes.JSONB,
            defaultValue: {},
            comment: 'تفاصيل الملكة: العمر، الحالة، علامات، سلوك'
        },
        brood_details: {
            type: DataTypes.JSONB,
            defaultValue: {},
            comment: 'تفاصيل الحضنة: البيض، اليرقات، العذارى، المساحة'
        },
        population_details: {
            type: DataTypes.JSONB,
            defaultValue: {},
            comment: 'تفاصيل الطائفة: عدد الإطارات المغطاة، النشاط، السلوك'
        },
        food_details: {
            type: DataTypes.JSONB,
            defaultValue: {},
            comment: 'تفاصيل الغذاء: العسل، اللقاح، الكمية المقدرة'
        },

        // الصحة والأمراض
        diseases_found: {
            type: DataTypes.ARRAY(DataTypes.STRING),
            defaultValue: [],
            comment: 'الأمراض المكتشفة'
        },
        pests_found: {
            type: DataTypes.ARRAY(DataTypes.STRING),
            defaultValue: [],
            comment: 'الآفات المكتشفة'
        },
        health_score: {
            type: DataTypes.INTEGER,
            allowNull: true,
            validate: {
                min: 0,
                max: 10
            },
            comment: 'نقاط الصحة العامة (0-10)'
        },

        // التقييم بالألوان
        overall_status: {
            type: DataTypes.ENUM('green', 'yellow', 'orange', 'red'),
            allowNull: true,
            comment: 'الحالة العامة بالألوان: أخضر=ممتاز، أصفر=جيد، برتقالي=يحتاج انتباه، أحمر=مشكلة'
        },

        // الإجراءات والتوصيات
        actions_taken: {
            type: DataTypes.ARRAY(DataTypes.STRING),
            defaultValue: [],
            comment: 'الإجراءات المتخذة أثناء الفحص'
        },
        recommendations: {
            type: DataTypes.ARRAY(DataTypes.STRING),
            defaultValue: [],
            comment: 'التوصيات للفحص القادم'
        },
        next_inspection_date: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: 'تاريخ الفحص القادم المقترح'
        },

        // الملاحظات والوسائط
        notes: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        photos: {
            type: DataTypes.ARRAY(DataTypes.STRING),
            defaultValue: [],
            comment: 'مسارات الصور'
        },
        audio_notes: {
            type: DataTypes.ARRAY(DataTypes.STRING),
            defaultValue: [],
            comment: 'مسارات التسجيلات الصوتية'
        },

        // معلومات إضافية
        duration_minutes: {
            type: DataTypes.INTEGER,
            allowNull: true,
            validate: {
                min: 1,
                max: 300 // 5 hours max
            },
            comment: 'مدة الفحص بالدقائق'
        },
        temperature_celsius: {
            type: DataTypes.DECIMAL(4, 1),
            allowNull: true,
            comment: 'درجة الحرارة أثناء الفحص'
        },

        // التقييم التلقائي
        auto_score: {
            type: DataTypes.INTEGER,
            allowNull: true,
            validate: {
                min: 0,
                max: 100
            },
            comment: 'النقاط التلقائية المحسوبة'
        },
        risk_level: {
            type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
            allowNull: true,
            comment: 'مستوى المخاطر المحسوب تلقائياً'
        }
    }, {
        tableName: 'inspections',
        indexes: [
            {
                fields: ['hive_id']
            },
            {
                fields: ['inspector_id']
            },
            {
                fields: ['inspection_date']
            },
            {
                fields: ['inspection_type']
            },
            {
                fields: ['overall_status']
            },
            {
                fields: ['risk_level']
            },
            {
                fields: ['next_inspection_date']
            }
        ],
        hooks: {
            beforeSave: (inspection, options) => {
                // حساب النقاط والحالة تلقائياً
                inspection.auto_score = inspection.calculateAutoScore();
                inspection.overall_status = inspection.determineOverallStatus();
                inspection.risk_level = inspection.calculateRiskLevel();

                // تحديد تاريخ الفحص القادم إذا لم يكن محدداً
                if (!inspection.next_inspection_date) {
                    inspection.next_inspection_date = inspection.suggestNextInspectionDate();
                }
            }
        }
    });

    Inspection.associate = (models) => {
        Inspection.belongsTo(models.Hive, {
            foreignKey: 'hive_id',
            as: 'hive'
        });

        Inspection.belongsTo(models.User, {
            foreignKey: 'inspector_id',
            as: 'inspector'
        });
    };

    // Instance methods
    Inspection.prototype.calculateAutoScore = function () {
        let score = 0;
        let maxScore = 0;

        // نقاط الملكة (25 نقطة)
        if (this.queen_present) {
            maxScore += 25;
            switch (this.queen_present) {
                case 'yes':
                    score += 25;
                    break;
                case 'not_seen':
                    score += 15;
                    break;
                case 'no':
                    score += 0;
                    break;
            }
        }

        // نقاط وضع البيض (25 نقطة)
        if (this.queen_laying) {
            maxScore += 25;
            switch (this.queen_laying) {
                case 'yes':
                    score += 25;
                    break;
                case 'poor':
                    score += 10;
                    break;
                case 'no':
                    score += 0;
                    break;
            }
        }

        // نقاط نمط الحضنة (20 نقطة)
        if (this.brood_pattern) {
            maxScore += 20;
            switch (this.brood_pattern) {
                case 'excellent':
                    score += 20;
                    break;
                case 'good':
                    score += 16;
                    break;
                case 'fair':
                    score += 12;
                    break;
                case 'poor':
                    score += 6;
                    break;
                case 'none':
                    score += 0;
                    break;
            }
        }

        // نقاط قوة الطائفة (15 نقطة)
        if (this.population_strength) {
            maxScore += 15;
            switch (this.population_strength) {
                case 'very_strong':
                    score += 15;
                    break;
                case 'strong':
                    score += 12;
                    break;
                case 'moderate':
                    score += 9;
                    break;
                case 'weak':
                    score += 5;
                    break;
                case 'very_weak':
                    score += 2;
                    break;
            }
        }

        // نقاط مخزون الغذاء (15 نقطة)
        if (this.food_stores) {
            maxScore += 15;
            switch (this.food_stores) {
                case 'abundant':
                    score += 15;
                    break;
                case 'adequate':
                    score += 12;
                    break;
                case 'low':
                    score += 8;
                    break;
                case 'critical':
                    score += 3;
                    break;
                case 'none':
                    score += 0;
                    break;
            }
        }

        // خصم نقاط للأمراض والآفات
        const diseaseCount = (this.diseases_found || []).length;
        const pestCount = (this.pests_found || []).length;
        score -= (diseaseCount * 5) + (pestCount * 3);

        // التأكد من أن النقاط في النطاق الصحيح
        if (maxScore === 0) return null;

        const percentage = Math.max(0, Math.min(100, Math.round((score / maxScore) * 100)));
        return percentage;
    };

    Inspection.prototype.determineOverallStatus = function () {
        const score = this.auto_score;

        if (score === null) return null;

        // تحديد اللون بناءً على النقاط والمشاكل
        const hasDisease = (this.diseases_found || []).length > 0;
        const hasPests = (this.pests_found || []).length > 0;
        const noQueen = this.queen_present === 'no';
        const criticalFood = this.food_stores === 'critical' || this.food_stores === 'none';

        // أحمر - مشاكل حرجة
        if (noQueen || criticalFood || score < 40) {
            return 'red';
        }

        // برتقالي - يحتاج انتباه
        if (hasDisease || hasPests || score < 60) {
            return 'orange';
        }

        // أصفر - جيد مع ملاحظات
        if (score < 80) {
            return 'yellow';
        }

        // أخضر - ممتاز
        return 'green';
    };

    Inspection.prototype.calculateRiskLevel = function () {
        const score = this.auto_score;
        const status = this.overall_status;

        // مستوى المخاطر بناءً على الحالة والنقاط
        if (status === 'red' || score < 30) {
            return 'critical';
        }

        if (status === 'orange' || score < 50) {
            return 'high';
        }

        if (status === 'yellow' || score < 70) {
            return 'medium';
        }

        return 'low';
    };

    Inspection.prototype.suggestNextInspectionDate = function () {
        const currentDate = new Date(this.inspection_date);
        const riskLevel = this.risk_level || this.calculateRiskLevel();

        // تحديد الفترة بناءً على مستوى المخاطر والموسم
        let daysToAdd;

        switch (riskLevel) {
            case 'critical':
                daysToAdd = 3; // فحص خلال 3 أيام
                break;
            case 'high':
                daysToAdd = 7; // فحص أسبوعي
                break;
            case 'medium':
                daysToAdd = 14; // فحص كل أسبوعين
                break;
            case 'low':
                daysToAdd = 21; // فحص كل 3 أسابيع
                break;
            default:
                daysToAdd = 14;
        }

        // تعديل بناءً على نوع الفحص
        if (this.inspection_type === 'disease_check') {
            daysToAdd = Math.min(daysToAdd, 7);
        } else if (this.inspection_type === 'treatment') {
            daysToAdd = Math.min(daysToAdd, 5);
        }

        const nextDate = new Date(currentDate);
        nextDate.setDate(nextDate.getDate() + daysToAdd);

        return nextDate;
    };

    Inspection.prototype.generateRecommendations = function () {
        const recommendations = [];

        // توصيات بناءً على الملكة
        if (this.queen_present === 'no') {
            recommendations.push('إدخال ملكة جديدة فوراً');
            recommendations.push('فحص سبب فقدان الملكة');
        } else if (this.queen_present === 'not_seen') {
            recommendations.push('البحث عن الملكة في الفحص القادم');
            recommendations.push('فحص وجود بيض حديث');
        }

        if (this.queen_laying === 'poor') {
            recommendations.push('مراقبة نمط وضع البيض');
            recommendations.push('فحص عمر الملكة وحالتها');
        } else if (this.queen_laying === 'no') {
            recommendations.push('استبدال الملكة');
        }

        // توصيات بناءً على الحضنة
        if (this.brood_pattern === 'poor') {
            recommendations.push('فحص الملكة وجودة وضع البيض');
            recommendations.push('التأكد من عدم وجود أمراض الحضنة');
        }

        // توصيات بناءً على قوة الطائفة
        if (this.population_strength === 'weak' || this.population_strength === 'very_weak') {
            recommendations.push('تقوية الطائفة بإضافة حضنة مغلقة');
            recommendations.push('تقليل حجم الخلية');
            recommendations.push('زيادة التغذية');
        }

        // توصيات بناءً على مخزون الغذاء
        if (this.food_stores === 'low' || this.food_stores === 'critical') {
            recommendations.push('تغذية فورية بالمحلول السكري');
            recommendations.push('إضافة عجينة البروتين');
        } else if (this.food_stores === 'none') {
            recommendations.push('تغذية طارئة فورية');
            recommendations.push('مراقبة يومية');
        }

        // توصيات بناءً على الأمراض
        if ((this.diseases_found || []).length > 0) {
            recommendations.push('بدء العلاج المناسب للأمراض المكتشفة');
            recommendations.push('عزل الخلية إذا لزم الأمر');
            recommendations.push('تطهير الأدوات');
        }

        // توصيات بناءً على الآفات
        if ((this.pests_found || []).length > 0) {
            recommendations.push('تطبيق برنامج مكافحة الآفات');
            recommendations.push('تحسين تهوية الخلية');
        }

        // توصيات عامة بناءً على الحالة
        if (this.overall_status === 'red') {
            recommendations.push('فحص طارئ خلال 3 أيام');
            recommendations.push('استشارة نحال خبير');
        } else if (this.overall_status === 'orange') {
            recommendations.push('فحص أسبوعي حتى تحسن الحالة');
        }

        return recommendations;
    };

    Inspection.prototype.getInspectionSummary = function () {
        return {
            id: this.id,
            date: this.inspection_date,
            type: this.inspection_type,
            score: this.auto_score,
            status: this.overall_status,
            risk_level: this.risk_level,
            quick_assessment: {
                queen_present: this.queen_present,
                queen_laying: this.queen_laying,
                brood_pattern: this.brood_pattern,
                population_strength: this.population_strength,
                food_stores: this.food_stores
            },
            issues: {
                diseases: this.diseases_found || [],
                pests: this.pests_found || []
            },
            next_inspection: this.next_inspection_date,
            recommendations: this.generateRecommendations()
        };
    };

    // Class methods
    Inspection.getHiveInspectionHistory = async function (hiveId, limit = 10) {
        return await Inspection.findAll({
            where: { hive_id: hiveId },
            order: [['inspection_date', 'DESC']],
            limit: limit,
            include: [{
                model: this.sequelize.models.User,
                as: 'inspector',
                attributes: ['id', 'name']
            }]
        });
    };

    Inspection.getInspectionsByStatus = async function (userId, status, limit = 50) {
        return await Inspection.findAll({
            where: {
                inspector_id: userId,
                overall_status: status
            },
            order: [['inspection_date', 'DESC']],
            limit: limit,
            include: [{
                model: this.sequelize.models.Hive,
                as: 'hive',
                attributes: ['id', 'name', 'apiary_id']
            }]
        });
    };

    Inspection.getOverdueInspections = async function (userId) {
        const today = new Date();

        return await Inspection.findAll({
            where: {
                inspector_id: userId,
                next_inspection_date: {
                    [this.sequelize.Sequelize.Op.lt]: today
                }
            },
            order: [['next_inspection_date', 'ASC']],
            include: [{
                model: this.sequelize.models.Hive,
                as: 'hive',
                attributes: ['id', 'name', 'apiary_id']
            }]
        });
    };

    return Inspection;
};