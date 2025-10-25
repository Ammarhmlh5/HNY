const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Hive = sequelize.define('Hive', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        apiary_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'apiaries',
                key: 'id'
            }
        },
        name: {
            type: DataTypes.STRING(50),
            allowNull: false,
            validate: {
                len: [1, 50]
            }
        },
        position: {
            type: DataTypes.JSONB,
            allowNull: false,
            validate: {
                hasRequiredFields(value) {
                    if (!value.row || !value.column) {
                        throw new Error('Position must include row and column');
                    }
                }
            }
        },
        type: {
            type: DataTypes.ENUM('بلدي', 'أمريكي', 'كيني', 'وارية', 'دادان', 'other'),
            allowNull: false
        },
        specifications: {
            type: DataTypes.JSONB,
            allowNull: false,
            validate: {
                hasRequiredFields(value) {
                    if (!value.frame_count || !value.dimensions) {
                        throw new Error('Specifications must include frame_count and dimensions');
                    }
                }
            }
        },
        colony: {
            type: DataTypes.JSONB,
            allowNull: false,
            validate: {
                hasRequiredFields(value) {
                    if (value.age === undefined || value.queen_age === undefined || !value.source) {
                        throw new Error('Colony must include age, queen_age, and source');
                    }
                }
            }
        },
        frames: {
            type: DataTypes.JSONB,
            defaultValue: {
                waxed: 0,
                empty: 0,
                brood: 0,
                honey: 0,
                pollen: 0
            }
        },
        status: {
            type: DataTypes.ENUM('active', 'queenless', 'dead', 'combined'),
            defaultValue: 'active'
        },
        last_inspection: {
            type: DataTypes.DATE,
            allowNull: true
        },
        health_score: {
            type: DataTypes.INTEGER,
            allowNull: true,
            validate: {
                min: 0,
                max: 40
            }
        },
        health_status: {
            type: DataTypes.ENUM('excellent', 'good', 'warning', 'critical'),
            allowNull: true
        },
        notes: {
            type: DataTypes.TEXT,
            allowNull: true
        }
    }, {
        tableName: 'hives',
        indexes: [
            {
                fields: ['apiary_id']
            },
            {
                fields: ['status']
            },
            {
                fields: ['health_status']
            },
            {
                fields: ['last_inspection']
            },
            {
                unique: true,
                fields: ['apiary_id', 'name']
            }
        ],
        hooks: {
            afterCreate: async (hive, options) => {
                // Update apiary hive count
                const apiary = await hive.getApiary();
                if (apiary) {
                    await apiary.updateHiveCount();
                }
            },
            afterDestroy: async (hive, options) => {
                // Update apiary hive count
                const apiary = await sequelize.models.Apiary.findByPk(hive.apiary_id);
                if (apiary) {
                    await apiary.updateHiveCount();
                }
            }
        }
    });

    Hive.associate = (models) => {
        Hive.belongsTo(models.Apiary, {
            foreignKey: 'apiary_id',
            as: 'apiary'
        });

        Hive.hasMany(models.Super, {
            foreignKey: 'hive_id',
            as: 'supers'
        });

        Hive.hasMany(models.Inspection, {
            foreignKey: 'hive_id',
            as: 'inspections'
        });

        Hive.hasMany(models.Feeding, {
            foreignKey: 'hive_id',
            as: 'feedings'
        });


    };

    // Instance methods
    Hive.prototype.calculateHealthScore = function (inspectionData) {
        let score = 0;

        // Queen and egg laying (10 points)
        if (inspectionData.queen_present) {
            score += 5;
            if (inspectionData.egg_pattern === 'regular') {
                score += 5;
            } else if (inspectionData.egg_pattern === 'irregular') {
                score += 3;
            } else if (inspectionData.egg_pattern === 'spotty') {
                score += 1;
            }
        }

        // Colony strength (10 points)
        if (inspectionData.colony_strength === 'strong') {
            score += 10;
        } else if (inspectionData.colony_strength === 'medium') {
            score += 7;
        } else if (inspectionData.colony_strength === 'weak') {
            score += 3;
        }

        // Brood health (10 points)
        if (inspectionData.brood_pattern === 'solid') {
            score += 10;
        } else if (inspectionData.brood_pattern === 'patchy') {
            score += 6;
        } else if (inspectionData.brood_pattern === 'scattered') {
            score += 2;
        }

        // Food stores (10 points)
        if (inspectionData.food_stores === 'abundant') {
            score += 10;
        } else if (inspectionData.food_stores === 'adequate') {
            score += 7;
        } else if (inspectionData.food_stores === 'low') {
            score += 3;
        } else if (inspectionData.food_stores === 'critical') {
            score += 0;
        }

        // Deduct points for diseases and pests
        if (inspectionData.diseases && inspectionData.diseases.length > 0) {
            score -= Math.min(inspectionData.diseases.length * 2, 10);
        }

        if (inspectionData.pests && inspectionData.pests.length > 0) {
            score -= Math.min(inspectionData.pests.length * 1, 5);
        }

        return Math.max(0, Math.min(40, score));
    };

    Hive.prototype.getHealthStatus = function (score) {
        if (score >= 35) return 'excellent';
        if (score >= 25) return 'good';
        if (score >= 15) return 'warning';
        return 'critical';
    };

    Hive.prototype.getTotalFrames = function () {
        const frames = this.frames || {};
        return (frames.waxed || 0) + (frames.empty || 0) + (frames.brood || 0) +
            (frames.honey || 0) + (frames.pollen || 0);
    };

    Hive.prototype.getCapacityUtilization = function () {
        const totalFrames = this.getTotalFrames();
        const maxFrames = this.specifications?.frame_count || 0;
        return maxFrames > 0 ? (totalFrames / maxFrames) * 100 : 0;
    };

    return Hive;
};