const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Frame = sequelize.define('Frame', {
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
        super_id: {
            type: DataTypes.UUID,
            allowNull: true, // null for brood chamber frames
            references: {
                model: 'supers',
                key: 'id'
            }
        },
        position: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                min: 1
            },
            comment: 'Position of frame within hive/super (1-based)'
        },
        type: {
            type: DataTypes.ENUM('brood', 'honey', 'mixed'),
            allowNull: false,
            comment: 'Primary purpose of the frame'
        },
        foundation_type: {
            type: DataTypes.ENUM('wired', 'unwired', 'plastic', 'natural'),
            allowNull: false,
            defaultValue: 'wired'
        },
        foundation_installed: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: 'When foundation was first installed'
        },
        wax_condition: {
            type: DataTypes.ENUM('new', 'light', 'medium', 'dark', 'black', 'damaged'),
            defaultValue: 'new',
            comment: 'Condition of the wax comb'
        },
        content: {
            type: DataTypes.JSONB,
            defaultValue: {
                brood: {
                    eggs: 0,        // percentage 0-100
                    larvae: 0,      // percentage 0-100
                    pupae: 0,       // percentage 0-100
                    pattern: 'none' // none, spotty, patchy, solid
                },
                honey: {
                    uncapped: 0,    // percentage 0-100
                    capped: 0,      // percentage 0-100
                    moisture: null, // moisture content if tested
                    type: null      // honey type if known
                },
                pollen: {
                    stored: 0,      // percentage 0-100
                    colors: [],     // array of pollen colors observed
                    freshness: null // fresh, old, fermented
                },
                empty: 0          // percentage of empty cells 0-100
            },
            validate: {
                validPercentages(value) {
                    const total = (value.brood?.eggs || 0) + (value.brood?.larvae || 0) +
                        (value.brood?.pupae || 0) + (value.honey?.uncapped || 0) +
                        (value.honey?.capped || 0) + (value.pollen?.stored || 0) +
                        (value.empty || 0);

                    if (total > 100) {
                        throw new Error('Total frame content cannot exceed 100%');
                    }
                }
            }
        },
        last_inspection: {
            type: DataTypes.DATE,
            allowNull: true
        },
        needs_replacement: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            comment: 'Whether frame needs replacement due to age or damage'
        },
        replacement_reason: {
            type: DataTypes.ENUM('age', 'damage', 'disease', 'poor_construction', 'other'),
            allowNull: true
        },
        notes: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        photos: {
            type: DataTypes.ARRAY(DataTypes.STRING),
            defaultValue: []
        }
    }, {
        tableName: 'frames',
        indexes: [
            {
                fields: ['hive_id']
            },
            {
                fields: ['super_id']
            },
            {
                fields: ['type']
            },
            {
                fields: ['wax_condition']
            },
            {
                fields: ['needs_replacement']
            },
            {
                unique: true,
                fields: ['hive_id', 'super_id', 'position'],
                name: 'unique_frame_position'
            }
        ]
    });

    Frame.associate = (models) => {
        Frame.belongsTo(models.Hive, {
            foreignKey: 'hive_id',
            as: 'hive'
        });

        Frame.belongsTo(models.Super, {
            foreignKey: 'super_id',
            as: 'super'
        });
    };

    // Instance methods
    Frame.prototype.getTotalContentPercentage = function () {
        const content = this.content;
        return (content.brood?.eggs || 0) + (content.brood?.larvae || 0) +
            (content.brood?.pupae || 0) + (content.honey?.uncapped || 0) +
            (content.honey?.capped || 0) + (content.pollen?.stored || 0) +
            (content.empty || 0);
    };

    Frame.prototype.getBroodPercentage = function () {
        const brood = this.content.brood || {};
        return (brood.eggs || 0) + (brood.larvae || 0) + (brood.pupae || 0);
    };

    Frame.prototype.getHoneyPercentage = function () {
        const honey = this.content.honey || {};
        return (honey.uncapped || 0) + (honey.capped || 0);
    };

    Frame.prototype.getPollenPercentage = function () {
        return this.content.pollen?.stored || 0;
    };

    Frame.prototype.getEmptyPercentage = function () {
        return this.content.empty || 0;
    };

    Frame.prototype.isReadyForHarvest = function () {
        const honey = this.content.honey || {};
        return (honey.capped || 0) >= 80; // 80% or more capped honey
    };

    Frame.prototype.hasBrood = function () {
        return this.getBroodPercentage() > 0;
    };

    Frame.prototype.getAge = function () {
        if (!this.foundation_installed) return null;

        const now = new Date();
        const installed = new Date(this.foundation_installed);
        const diffTime = Math.abs(now - installed);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // days
    };

    Frame.prototype.shouldBeReplaced = function () {
        const age = this.getAge();

        // Check age-based replacement (typically 2-3 years for brood frames)
        if (age && age > 1095) { // 3 years
            return { should: true, reason: 'age', priority: 'medium' };
        }

        // Check wax condition
        if (this.wax_condition === 'black' || this.wax_condition === 'damaged') {
            return { should: true, reason: 'condition', priority: 'high' };
        }

        // Check if already marked for replacement
        if (this.needs_replacement) {
            return { should: true, reason: this.replacement_reason || 'marked', priority: 'high' };
        }

        return { should: false, reason: null, priority: null };
    };

    Frame.prototype.getBroodPattern = function () {
        const brood = this.content.brood || {};
        return brood.pattern || 'none';
    };

    Frame.prototype.getProductivityScore = function () {
        let score = 0;

        // Score based on content utilization
        const totalUsed = 100 - (this.content.empty || 0);
        score += Math.min(totalUsed, 100) * 0.4; // 40% weight for utilization

        // Score based on brood quality (for brood frames)
        if (this.type === 'brood' || this.type === 'mixed') {
            const broodPattern = this.getBroodPattern();
            const patternScore = {
                'solid': 100,
                'patchy': 70,
                'spotty': 40,
                'none': 0
            };
            score += (patternScore[broodPattern] || 0) * 0.3; // 30% weight
        }

        // Score based on honey content (for honey frames)
        if (this.type === 'honey' || this.type === 'mixed') {
            const honeyPercentage = this.getHoneyPercentage();
            score += honeyPercentage * 0.3; // 30% weight
        }

        // Penalty for poor wax condition
        const conditionPenalty = {
            'new': 0,
            'light': 5,
            'medium': 10,
            'dark': 20,
            'black': 40,
            'damaged': 50
        };
        score -= conditionPenalty[this.wax_condition] || 0;

        return Math.max(0, Math.min(100, Math.round(score)));
    };

    // Class methods
    Frame.getFramesByHive = async function (hiveId, includeSupers = true) {
        const whereClause = { hive_id: hiveId };

        if (!includeSupers) {
            whereClause.super_id = null;
        }

        return await Frame.findAll({
            where: whereClause,
            order: [['super_id', 'ASC'], ['position', 'ASC']]
        });
    };

    Frame.getFramesBySuper = async function (superId) {
        return await Frame.findAll({
            where: { super_id: superId },
            order: [['position', 'ASC']]
        });
    };

    Frame.getFramesNeedingReplacement = async function (hiveId) {
        const frames = await Frame.findAll({
            where: { hive_id: hiveId }
        });

        return frames.filter(frame => frame.shouldBeReplaced().should);
    };

    Frame.calculateHiveFrameStats = async function (hiveId) {
        const frames = await Frame.getFramesByHive(hiveId);

        const stats = {
            total_frames: frames.length,
            brood_frames: 0,
            honey_frames: 0,
            mixed_frames: 0,
            empty_frames: 0,
            frames_needing_replacement: 0,
            average_productivity: 0,
            total_brood_percentage: 0,
            total_honey_percentage: 0,
            total_pollen_percentage: 0,
            wax_condition_distribution: {
                new: 0, light: 0, medium: 0, dark: 0, black: 0, damaged: 0
            }
        };

        if (frames.length === 0) return stats;

        let totalProductivity = 0;
        let totalBrood = 0;
        let totalHoney = 0;
        let totalPollen = 0;

        frames.forEach(frame => {
            // Count by type
            if (frame.type === 'brood') stats.brood_frames++;
            else if (frame.type === 'honey') stats.honey_frames++;
            else if (frame.type === 'mixed') stats.mixed_frames++;

            // Check if effectively empty
            if (frame.getTotalContentPercentage() < 10) {
                stats.empty_frames++;
            }

            // Check replacement needs
            if (frame.shouldBeReplaced().should) {
                stats.frames_needing_replacement++;
            }

            // Accumulate percentages
            totalProductivity += frame.getProductivityScore();
            totalBrood += frame.getBroodPercentage();
            totalHoney += frame.getHoneyPercentage();
            totalPollen += frame.getPollenPercentage();

            // Wax condition distribution
            stats.wax_condition_distribution[frame.wax_condition]++;
        });

        // Calculate averages
        stats.average_productivity = Math.round(totalProductivity / frames.length);
        stats.total_brood_percentage = Math.round(totalBrood / frames.length);
        stats.total_honey_percentage = Math.round(totalHoney / frames.length);
        stats.total_pollen_percentage = Math.round(totalPollen / frames.length);

        return stats;
    };

    return Frame;
};