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
        position: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                min: 1
            },
            comment: 'Position from bottom (1 = first super above brood chamber)'
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
        purpose: {
            type: DataTypes.ENUM('honey_production', 'brood_expansion', 'queen_excluder_test', 'winter_storage'),
            defaultValue: 'honey_production'
        },
        foundation_type: {
            type: DataTypes.ENUM('wired', 'unwired', 'plastic', 'drawn_comb'),
            defaultValue: 'wired'
        },
        capacity_utilization: {
            type: DataTypes.DECIMAL(5, 2),
            defaultValue: 0.00,
            validate: {
                min: 0,
                max: 100
            },
            comment: 'Percentage of frames being used by bees'
        },
        honey_content: {
            type: DataTypes.JSONB,
            defaultValue: {
                uncapped_percentage: 0,
                capped_percentage: 0,
                estimated_weight: 0,
                moisture_content: null,
                honey_type: null
            }
        },
        harvest_data: {
            type: DataTypes.JSONB,
            allowNull: true,
            validate: {
                isValidHarvestData(value) {
                    if (value && value.honey_amount !== undefined && value.honey_amount < 0) {
                        throw new Error('Harvest data honey_amount cannot be negative');
                    }
                }
            }
        },
        status: {
            type: DataTypes.ENUM('empty', 'building', 'partial', 'full', 'capped', 'ready_harvest', 'removed'),
            defaultValue: 'empty'
        },
        queen_excluder: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            comment: 'Whether queen excluder is used below this super'
        },
        last_inspection: {
            type: DataTypes.DATE,
            allowNull: true
        },
        inspection_notes: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        photos: {
            type: DataTypes.ARRAY(DataTypes.STRING),
            defaultValue: []
        },
        notes: {
            type: DataTypes.TEXT,
            allowNull: true
        }
    }, {
        tableName: 'supers_advanced',
        indexes: [
            {
                fields: ['hive_id']
            },
            {
                fields: ['status']
            },
            {
                fields: ['added_at']
            },
            {
                fields: ['purpose']
            },
            {
                unique: true,
                fields: ['hive_id', 'position'],
                name: 'unique_super_position_advanced',
                where: {
                    removed_at: null
                }
            }
        ],
        hooks: {
            beforeCreate: async (superInstance, options) => {
                // Auto-assign position if not provided
                if (!superInstance.position) {
                    const maxPosition = await Super.max('position', {
                        where: {
                            hive_id: superInstance.hive_id,
                            removed_at: null
                        }
                    });
                    superInstance.position = (maxPosition || 0) + 1;
                }
            },
            afterUpdate: async (superInstance, options) => {
                // Update status based on honey content
                if (superInstance.changed('honey_content')) {
                    const honeyContent = superInstance.honey_content;
                    const totalHoney = (honeyContent.uncapped_percentage || 0) + (honeyContent.capped_percentage || 0);

                    let newStatus = superInstance.status;

                    if (totalHoney === 0) {
                        newStatus = 'empty';
                    } else if (totalHoney < 25) {
                        newStatus = 'building';
                    } else if (totalHoney < 75) {
                        newStatus = 'partial';
                    } else if (totalHoney >= 75 && (honeyContent.capped_percentage || 0) < 50) {
                        newStatus = 'full';
                    } else if ((honeyContent.capped_percentage || 0) >= 50) {
                        newStatus = 'capped';
                    }

                    if ((honeyContent.capped_percentage || 0) >= 80) {
                        newStatus = 'ready_harvest';
                    }

                    if (newStatus !== superInstance.status) {
                        await superInstance.update({ status: newStatus }, { hooks: false });
                    }
                }
            }
        }
    });

    Super.associate = (models) => {
        Super.belongsTo(models.Hive, {
            foreignKey: 'hive_id',
            as: 'hive'
        });

        Super.hasMany(models.Frame, {
            foreignKey: 'super_id',
            as: 'frames'
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

    Super.prototype.getExpectedCapacity = function () {
        // Expected honey capacity based on super type (in kg)
        const capacities = {
            'deep': this.frame_count * 2.5,    // ~2.5kg per deep frame
            'medium': this.frame_count * 1.8,  // ~1.8kg per medium frame
            'shallow': this.frame_count * 1.2  // ~1.2kg per shallow frame
        };

        return capacities[this.type] || this.frame_count * 1.8;
    };

    Super.prototype.getEstimatedWeight = function () {
        const honeyContent = this.honey_content || {};
        const totalHoneyPercentage = (honeyContent.uncapped_percentage || 0) + (honeyContent.capped_percentage || 0);
        const expectedCapacity = this.getExpectedCapacity();

        return Math.round((expectedCapacity * totalHoneyPercentage / 100) * 100) / 100;
    };

    Super.prototype.isReadyForHarvest = function () {
        const honeyContent = this.honey_content || {};
        return (honeyContent.capped_percentage || 0) >= 80 && this.status === 'ready_harvest';
    };

    Super.prototype.getFillingRate = function () {
        const daysInUse = this.getDaysInUse();
        if (daysInUse === 0) return 0;

        const currentUtilization = this.capacity_utilization || 0;
        return Math.round((currentUtilization / daysInUse) * 100) / 100; // percentage per day
    };

    Super.prototype.getProjectedCompletionDate = function () {
        const fillingRate = this.getFillingRate();
        if (fillingRate <= 0) return null;

        const currentUtilization = this.capacity_utilization || 0;
        const remainingPercentage = 100 - currentUtilization;
        const daysToComplete = Math.ceil(remainingPercentage / fillingRate);

        const completionDate = new Date();
        completionDate.setDate(completionDate.getDate() + daysToComplete);

        return completionDate;
    };

    Super.prototype.getEfficiencyRating = function () {
        const daysInUse = this.getDaysInUse();
        const utilization = this.capacity_utilization || 0;

        if (daysInUse === 0) return 'new';

        const expectedUtilization = Math.min(daysInUse * 2, 100); // Expect 2% per day
        const efficiency = utilization / expectedUtilization;

        if (efficiency >= 1.2) return 'excellent';
        if (efficiency >= 1.0) return 'good';
        if (efficiency >= 0.7) return 'average';
        return 'poor';
    };

    Super.prototype.needsAttention = function () {
        const issues = [];

        // Check if super has been stagnant
        const daysInUse = this.getDaysInUse();
        const utilization = this.capacity_utilization || 0;

        if (daysInUse > 30 && utilization < 25) {
            issues.push({
                type: 'slow_progress',
                severity: 'medium',
                message: 'العسلة تتقدم ببطء - تحقق من قوة الطائفة ومصادر الرحيق'
            });
        }

        if (daysInUse > 60 && utilization < 50) {
            issues.push({
                type: 'very_slow_progress',
                severity: 'high',
                message: 'العسلة لا تمتلئ - قد تحتاج لإزالتها أو تقوية الطائفة'
            });
        }

        // Check if ready for harvest but not harvested
        if (this.isReadyForHarvest() && daysInUse > 90) {
            issues.push({
                type: 'overdue_harvest',
                severity: 'high',
                message: 'العسلة جاهزة للقطف منذ فترة طويلة'
            });
        }

        // Check inspection frequency
        if (this.last_inspection) {
            const daysSinceInspection = Math.floor((new Date() - new Date(this.last_inspection)) / (1000 * 60 * 60 * 24));
            if (daysSinceInspection > 21) {
                issues.push({
                    type: 'inspection_overdue',
                    severity: 'medium',
                    message: `لم يتم فحص العسلة منذ ${daysSinceInspection} يوم`
                });
            }
        }

        return issues;
    };

    // Class methods
    Super.getActiveSupersForHive = async function (hiveId) {
        return await Super.findAll({
            where: {
                hive_id: hiveId,
                removed_at: null
            },
            order: [['position', 'ASC']]
        });
    };

    Super.getHiveCapacityStats = async function (hiveId) {
        const supers = await Super.getActiveSupersForHive(hiveId);

        const stats = {
            total_supers: supers.length,
            total_frames: supers.reduce((sum, s) => sum + s.frame_count, 0),
            average_utilization: 0,
            total_estimated_honey: 0,
            supers_ready_harvest: 0,
            supers_needing_attention: 0,
            projected_harvest_date: null
        };

        if (supers.length === 0) return stats;

        let totalUtilization = 0;
        let totalHoney = 0;
        let readyCount = 0;
        let attentionCount = 0;
        let nearestCompletion = null;

        supers.forEach(superInstance => {
            totalUtilization += superInstance.capacity_utilization || 0;
            totalHoney += superInstance.getEstimatedWeight();

            if (superInstance.isReadyForHarvest()) {
                readyCount++;
            }

            if (superInstance.needsAttention().length > 0) {
                attentionCount++;
            }

            const completion = superInstance.getProjectedCompletionDate();
            if (completion && (!nearestCompletion || completion < nearestCompletion)) {
                nearestCompletion = completion;
            }
        });

        stats.average_utilization = Math.round(totalUtilization / supers.length);
        stats.total_estimated_honey = Math.round(totalHoney * 100) / 100;
        stats.supers_ready_harvest = readyCount;
        stats.supers_needing_attention = attentionCount;
        stats.projected_harvest_date = nearestCompletion;

        return stats;
    };

    Super.reorderPositions = async function (hiveId) {
        const supers = await Super.findAll({
            where: {
                hive_id: hiveId,
                removed_at: null
            },
            order: [['position', 'ASC']]
        });

        for (let i = 0; i < supers.length; i++) {
            if (supers[i].position !== i + 1) {
                await supers[i].update({ position: i + 1 });
            }
        }
    };

    return Super;
};