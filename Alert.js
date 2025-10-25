const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Alert = sequelize.define('Alert', {
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
        type: {
            type: DataTypes.ENUM(
                'inspection_reminder',
                'health_issue',
                'feeding_required',
                'seasonal_task',
                'weather_warning',
                'equipment_maintenance',
                'harvest_ready',
                'queen_replacement',
                'swarm_alert',
                'disease_warning',
                'custom'
            ),
            allowNull: false,
            defaultValue: 'custom'
        },
        priority: {
            type: DataTypes.ENUM('low', 'medium', 'high'),
            allowNull: false,
            defaultValue: 'medium'
        },
        title: {
            type: DataTypes.STRING(200),
            allowNull: false
        },
        message: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        metadata: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Additional data related to the alert (inspection_id, weather_data, etc.)'
        },
        is_read: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        is_resolved: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        read_at: {
            type: DataTypes.DATE,
            allowNull: true
        },
        resolved_at: {
            type: DataTypes.DATE,
            allowNull: true
        },
        resolution_notes: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        expires_at: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: 'Optional expiration date for time-sensitive alerts'
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
        tableName: 'alerts',
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
                fields: ['type']
            },
            {
                fields: ['priority']
            },
            {
                fields: ['is_read']
            },
            {
                fields: ['is_resolved']
            },
            {
                fields: ['created_at']
            },
            {
                fields: ['expires_at']
            },
            {
                fields: ['user_id', 'is_read', 'created_at']
            },
            {
                fields: ['user_id', 'type', 'is_resolved']
            }
        ]
    });

    // Instance methods
    Alert.prototype.markAsRead = function () {
        this.is_read = true;
        this.read_at = new Date();
        return this.save();
    };

    Alert.prototype.markAsResolved = function (notes = null) {
        this.is_resolved = true;
        this.resolved_at = new Date();
        if (notes) {
            this.resolution_notes = notes;
        }
        return this.save();
    };

    Alert.prototype.isExpired = function () {
        return this.expires_at && new Date() > this.expires_at;
    };

    Alert.prototype.getTimeAgo = function () {
        const now = new Date();
        const created = new Date(this.created_at);
        const diffInMinutes = Math.floor((now - created) / (1000 * 60));

        if (diffInMinutes < 1) return 'الآن';
        if (diffInMinutes < 60) return `منذ ${diffInMinutes} دقيقة`;

        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `منذ ${diffInHours} ساعة`;

        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays < 7) return `منذ ${diffInDays} يوم`;

        const diffInWeeks = Math.floor(diffInDays / 7);
        if (diffInWeeks < 4) return `منذ ${diffInWeeks} أسبوع`;

        const diffInMonths = Math.floor(diffInDays / 30);
        return `منذ ${diffInMonths} شهر`;
    };

    Alert.prototype.getPriorityColor = function () {
        const colors = {
            low: 'gray',
            medium: 'warning',
            high: 'danger'
        };
        return colors[this.priority] || 'gray';
    };

    Alert.prototype.getTypeIcon = function () {
        const icons = {
            inspection_reminder: 'calendar',
            health_issue: 'alert-triangle',
            feeding_required: 'droplets',
            seasonal_task: 'sun',
            weather_warning: 'cloud-rain',
            equipment_maintenance: 'wrench',
            harvest_ready: 'package',
            queen_replacement: 'crown',
            swarm_alert: 'zap',
            disease_warning: 'shield-alert',
            custom: 'bell'
        };
        return icons[this.type] || 'bell';
    };

    Alert.prototype.getActionable = function () {
        // Return suggested actions based on alert type and metadata
        const actions = {
            inspection_reminder: [
                { type: 'inspect', label: 'فحص الخلية', url: `/hives/${this.hive_id}/inspect` },
                { type: 'schedule', label: 'جدولة فحص', url: `/schedule/inspection/${this.hive_id}` }
            ],
            health_issue: [
                { type: 'inspect', label: 'فحص تفصيلي', url: `/hives/${this.hive_id}/inspect` },
                { type: 'treatment', label: 'خطة العلاج', url: `/hives/${this.hive_id}/treatment` }
            ],
            feeding_required: [
                { type: 'feed', label: 'بدء التغذية', url: `/hives/${this.hive_id}/feeding` },
                { type: 'calculate', label: 'حساب المقادير', url: `/feeding/calculator` }
            ],
            seasonal_task: [
                { type: 'learn', label: 'تعلم المزيد', url: `/guides/seasonal/${this.metadata?.season}` },
                { type: 'schedule', label: 'جدولة المهمة', url: `/schedule/task` }
            ]
        };

        return actions[this.type] || [
            { type: 'view', label: 'عرض التفاصيل', url: `/alerts/${this.id}` }
        ];
    };

    // Class methods
    Alert.getUnreadCount = async function (userId) {
        return await this.count({
            where: {
                user_id: userId,
                is_read: false
            }
        });
    };

    Alert.getHighPriorityCount = async function (userId) {
        return await this.count({
            where: {
                user_id: userId,
                priority: 'high',
                is_resolved: false
            }
        });
    };

    Alert.cleanupExpired = async function () {
        const now = new Date();
        return await this.destroy({
            where: {
                expires_at: {
                    [sequelize.Sequelize.Op.lt]: now
                }
            }
        });
    };

    Alert.getRecentByType = async function (userId, type, limit = 5) {
        return await this.findAll({
            where: {
                user_id: userId,
                type: type
            },
            order: [['created_at', 'DESC']],
            limit: limit
        });
    };

    return Alert;
};