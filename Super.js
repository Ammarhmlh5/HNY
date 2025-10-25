const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Super = sequelize.define('Super', {
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
        type: {
            type: DataTypes.ENUM('deep', 'medium', 'shallow'),
            allowNull: false
        },
        frame_count: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                min: 1,
                max: 20
            }
        },
        added_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        },
        removed_at: {
            type: DataTypes.DATE,
            allowNull: true
        },
        harvest_data: {
            type: DataTypes.JSONB,
            allowNull: true,
            validate: {
                isValidHarvestData(value) {
                    if (value && (!value.honey_amount || value.honey_amount < 0)) {
                        throw new Error('Harvest data must include valid honey_amount');
                    }
                }
            }
        },
        status: {
            type: DataTypes.ENUM('empty', 'partial', 'full', 'capped', 'removed'),
            defaultValue: 'empty'
        },
        notes: {
            type: DataTypes.TEXT,
            allowNull: true
        }
    }, {
        tableName: 'supers',
        indexes: [
            {
                fields: ['hive_id']
            },
            {
                fields: ['status']
            },
            {
                fields: ['added_at']
            }
        ]
    });

    Super.associate = (models) => {
        Super.belongsTo(models.Hive, {
            foreignKey: 'hive_id',
            as: 'hive'
        });
    };

    // Instance methods
    Super.prototype.getDaysInUse = function () {
        const endDate = this.removed_at || new Date();
        const startDate = this.added_at;
        const diffTime = Math.abs(endDate - startDate);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    Super.prototype.getHoneyYield = function () {
        return this.harvest_data?.honey_amount || 0;
    };

    Super.prototype.isActive = function () {
        return !this.removed_at && this.status !== 'removed';
    };

    return Super;
};