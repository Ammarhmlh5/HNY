const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Apiary = sequelize.define('Apiary', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        name: {
            type: DataTypes.STRING(100),
            allowNull: false,
            validate: {
                len: [2, 100]
            }
        },
        owner_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id'
            }
        },
        location: {
            type: DataTypes.JSONB,
            allowNull: false,
            validate: {
                hasRequiredFields(value) {
                    if (!value.coordinates || !value.coordinates.latitude || !value.coordinates.longitude) {
                        throw new Error('Location must include coordinates with latitude and longitude');
                    }
                }
            }
        },
        type: {
            type: DataTypes.ENUM('fixed', 'mobile'),
            defaultValue: 'fixed'
        },
        hive_count: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            validate: {
                min: 0
            }
        },
        status: {
            type: DataTypes.ENUM('active', 'inactive', 'seasonal'),
            defaultValue: 'active'
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        location_history: {
            type: DataTypes.JSONB,
            defaultValue: [],
            comment: 'For mobile apiaries - track location changes'
        },
        privacy_settings: {
            type: DataTypes.JSONB,
            defaultValue: {
                visibility: 'private', // private, friends, public
                show_exact_location: false,
                show_hive_count: false,
                allow_messages: true
            }
        }
    }, {
        tableName: 'apiaries',
        indexes: [
            {
                fields: ['owner_id']
            },
            {
                fields: ['type']
            },
            {
                fields: ['status']
            },
            {
                name: 'apiary_location_gist',
                fields: [sequelize.literal("((location->'coordinates')::text)")],
                using: 'gist'
            }
        ],
        hooks: {
            afterCreate: async (apiary, options) => {
                // Add initial location to history for mobile apiaries
                if (apiary.type === 'mobile') {
                    await apiary.update({
                        location_history: [{
                            coordinates: apiary.location.coordinates,
                            timestamp: new Date(),
                            reason: 'initial_setup'
                        }]
                    });
                }
            }
        }
    });

    Apiary.associate = (models) => {
        Apiary.belongsTo(models.User, {
            foreignKey: 'owner_id',
            as: 'owner'
        });

        Apiary.hasMany(models.Hive, {
            foreignKey: 'apiary_id',
            as: 'hives'
        });
    };

    // Instance methods
    Apiary.prototype.updateHiveCount = async function () {
        const hiveCount = await this.sequelize.models.Hive.count({
            where: { apiary_id: this.id }
        });

        await this.update({ hive_count: hiveCount });
        return hiveCount;
    };

    Apiary.prototype.addLocationHistory = async function (coordinates, reason = 'manual_update') {
        const newHistory = [...(this.location_history || []), {
            coordinates,
            timestamp: new Date(),
            reason
        }];

        await this.update({ location_history: newHistory });
    };

    return Apiary;
};