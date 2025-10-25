const { Frame, Hive, Super, Apiary } = require('../models');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

class FrameService {
    /**
     * Create a new frame
     * @param {Object} data - Frame data
     * @param {string} hiveId - Hive ID
     * @param {string} userId - User ID
     * @returns {Promise<Frame>}
     */
    async createFrame(data, hiveId, userId) {
        try {
            // Verify user owns the hive
            const hive = await Hive.findOne({
                where: { id: hiveId },
                include: [{
                    model: Apiary,
                    as: 'apiary',
                    where: { owner_id: userId }
                }]
            });

            if (!hive) {
                throw new AppError('Hive not found', 404, 'HIVE_NOT_FOUND');
            }

            // Verify super exists if super_id is provided
            if (data.super_id) {
                const superExists = await Super.findOne({
                    where: {
                        id: data.super_id,
                        hive_id: hiveId
                    }
                });

                if (!superExists) {
                    throw new AppError('Super not found in this hive', 404, 'SUPER_NOT_FOUND');
                }
            }

            // Check for duplicate position
            const existingFrame = await Frame.findOne({
                where: {
                    hive_id: hiveId,
                    super_id: data.super_id || null,
                    position: data.position
                }
            });

            if (existingFrame) {
                throw new AppError('Frame position already occupied', 400, 'POSITION_OCCUPIED');
            }

            const frame = await Frame.create({
                ...data,
                hive_id: hiveId
            });

            logger.info(`New frame created: ${frame.id} in hive ${hiveId}`);

            return frame;
        } catch (error) {
            logger.error('Error creating frame:', error);
            throw error;
        }
    }

    /**
     * Update frame content and status
     * @param {string} frameId - Frame ID
     * @param {string} userId - User ID
     * @param {Object} updateData - Update data
     * @returns {Promise<Frame>}
     */
    async updateFrame(frameId, userId, updateData) {
        const frame = await Frame.findOne({
            where: { id: frameId },
            include: [{
                model: Hive,
                as: 'hive',
                include: [{
                    model: Apiary,
                    as: 'apiary',
                    where: { owner_id: userId }
                }]
            }]
        });

        if (!frame) {
            throw new AppError('Frame not found', 404, 'FRAME_NOT_FOUND');
        }

        // Validate content percentages if being updated
        if (updateData.content) {
            this.validateFrameContent(updateData.content);
        }

        // Auto-update last_inspection if content is being updated
        if (updateData.content && !updateData.last_inspection) {
            updateData.last_inspection = new Date();
        }

        const updatedFrame = await frame.update(updateData);

        logger.info(`Frame updated: ${frameId} by user ${userId}`);

        return updatedFrame;
    }

    /**
     * Get frame by ID with ownership check
     * @param {string} frameId - Frame ID
     * @param {string} userId - User ID
     * @returns {Promise<Frame>}
     */
    async getFrameById(frameId, userId) {
        const frame = await Frame.findOne({
            where: { id: frameId },
            include: [
                {
                    model: Hive,
                    as: 'hive',
                    include: [{
                        model: Apiary,
                        as: 'apiary',
                        where: { owner_id: userId }
                    }]
                },
                {
                    model: Super,
                    as: 'super',
                    required: false
                }
            ]
        });

        if (!frame) {
            throw new AppError('Frame not found', 404, 'FRAME_NOT_FOUND');
        }

        return frame;
    }

    /**
     * Get all frames for a hive
     * @param {string} hiveId - Hive ID
     * @param {string} userId - User ID
     * @param {Object} options - Query options
     * @returns {Promise<Array>}
     */
    async getHiveFrames(hiveId, userId, options = {}) {
        // Verify ownership
        const hive = await Hive.findOne({
            where: { id: hiveId },
            include: [{
                model: Apiary,
                as: 'apiary',
                where: { owner_id: userId }
            }]
        });

        if (!hive) {
            throw new AppError('Hive not found', 404, 'HIVE_NOT_FOUND');
        }

        const { includeSupers = true, type = null } = options;
        const whereClause = { hive_id: hiveId };

        if (!includeSupers) {
            whereClause.super_id = null;
        }

        if (type) {
            whereClause.type = type;
        }

        const frames = await Frame.findAll({
            where: whereClause,
            include: [{
                model: Super,
                as: 'super',
                required: false
            }],
            order: [['super_id', 'ASC'], ['position', 'ASC']]
        });

        return frames;
    }

    /**
     * Analyze frame productivity and health
     * @param {string} frameId - Frame ID
     * @param {string} userId - User ID
     * @returns {Promise<Object>}
     */
    async analyzeFrame(frameId, userId) {
        const frame = await this.getFrameById(frameId, userId);

        const analysis = {
            productivity_score: frame.getProductivityScore(),
            content_breakdown: {
                brood_percentage: frame.getBroodPercentage(),
                honey_percentage: frame.getHoneyPercentage(),
                pollen_percentage: frame.getPollenPercentage(),
                empty_percentage: frame.getEmptyPercentage()
            },
            health_indicators: {
                brood_pattern: frame.getBroodPattern(),
                wax_condition: frame.wax_condition,
                age_days: frame.getAge()
            },
            replacement_analysis: frame.shouldBeReplaced(),
            recommendations: []
        };

        // Generate recommendations
        analysis.recommendations = this.generateFrameRecommendations(frame, analysis);

        return analysis;
    }

    /**
     * Get frames needing replacement for a hive
     * @param {string} hiveId - Hive ID
     * @param {string} userId - User ID
     * @returns {Promise<Array>}
     */
    async getFramesNeedingReplacement(hiveId, userId) {
        const frames = await this.getHiveFrames(hiveId, userId);

        return frames
            .filter(frame => frame.shouldBeReplaced().should)
            .map(frame => ({
                frame,
                replacement_info: frame.shouldBeReplaced(),
                age_days: frame.getAge(),
                productivity_score: frame.getProductivityScore()
            }))
            .sort((a, b) => {
                // Sort by priority (high first) then by age
                const priorityOrder = { high: 3, medium: 2, low: 1 };
                const aPriority = priorityOrder[a.replacement_info.priority] || 0;
                const bPriority = priorityOrder[b.replacement_info.priority] || 0;

                if (aPriority !== bPriority) {
                    return bPriority - aPriority;
                }

                return (b.age_days || 0) - (a.age_days || 0);
            });
    }

    /**
     * Bulk update frame positions (for reorganization)
     * @param {string} hiveId - Hive ID
     * @param {string} userId - User ID
     * @param {Array} positionUpdates - Array of {frameId, newPosition, superId}
     * @returns {Promise<Array>}
     */
    async bulkUpdatePositions(hiveId, userId, positionUpdates) {
        // Verify ownership
        const hive = await Hive.findOne({
            where: { id: hiveId },
            include: [{
                model: Apiary,
                as: 'apiary',
                where: { owner_id: userId }
            }]
        });

        if (!hive) {
            throw new AppError('Hive not found', 404, 'HIVE_NOT_FOUND');
        }

        const updatedFrames = [];

        for (const update of positionUpdates) {
            const frame = await Frame.findOne({
                where: {
                    id: update.frameId,
                    hive_id: hiveId
                }
            });

            if (frame) {
                await frame.update({
                    position: update.newPosition,
                    super_id: update.superId || null
                });
                updatedFrames.push(frame);
            }
        }

        logger.info(`Bulk updated ${updatedFrames.length} frame positions in hive ${hiveId}`);

        return updatedFrames;
    }

    /**
     * Generate frame management recommendations
     * @param {string} hiveId - Hive ID
     * @param {string} userId - User ID
     * @returns {Promise<Object>}
     */
    async getFrameManagementRecommendations(hiveId, userId) {
        const frames = await this.getHiveFrames(hiveId, userId);
        const stats = await Frame.calculateHiveFrameStats(hiveId);

        const recommendations = {
            immediate_actions: [],
            maintenance_tasks: [],
            optimization_suggestions: [],
            replacement_schedule: []
        };

        // Analyze frames needing immediate attention
        const criticalFrames = frames.filter(f => {
            const replacement = f.shouldBeReplaced();
            return replacement.should && replacement.priority === 'high';
        });

        if (criticalFrames.length > 0) {
            recommendations.immediate_actions.push({
                type: 'frame_replacement',
                priority: 'high',
                message: `${criticalFrames.length} إطار يحتاج استبدال فوري`,
                frames: criticalFrames.map(f => ({ id: f.id, position: f.position, reason: f.shouldBeReplaced().reason }))
            });
        }

        // Check for poor productivity
        const lowProductivityFrames = frames.filter(f => f.getProductivityScore() < 40);
        if (lowProductivityFrames.length > 0) {
            recommendations.maintenance_tasks.push({
                type: 'productivity_improvement',
                priority: 'medium',
                message: `${lowProductivityFrames.length} إطار يحتاج تحسين الإنتاجية`,
                suggestion: 'تحقق من جودة الأساس الشمعي وقوة الطائفة'
            });
        }

        // Check frame distribution
        if (stats.brood_frames < 6 && stats.total_frames > 8) {
            recommendations.optimization_suggestions.push({
                type: 'frame_distribution',
                priority: 'low',
                message: 'عدد إطارات الحضنة قليل نسبياً',
                suggestion: 'فكر في تحويل بعض الإطارات الفارغة لإطارات حضنة'
            });
        }

        // Generate replacement schedule
        const replacementFrames = frames.filter(f => f.shouldBeReplaced().should);
        const scheduleByPriority = {
            high: replacementFrames.filter(f => f.shouldBeReplaced().priority === 'high'),
            medium: replacementFrames.filter(f => f.shouldBeReplaced().priority === 'medium'),
            low: replacementFrames.filter(f => f.shouldBeReplaced().priority === 'low')
        };

        Object.entries(scheduleByPriority).forEach(([priority, frames]) => {
            if (frames.length > 0) {
                const timeframe = priority === 'high' ? 'خلال أسبوع' :
                    priority === 'medium' ? 'خلال شهر' : 'خلال الموسم القادم';

                recommendations.replacement_schedule.push({
                    priority,
                    timeframe,
                    frame_count: frames.length,
                    frames: frames.map(f => ({
                        id: f.id,
                        position: f.position,
                        age_days: f.getAge(),
                        reason: f.shouldBeReplaced().reason
                    }))
                });
            }
        });

        return {
            stats,
            recommendations,
            summary: {
                total_frames: stats.total_frames,
                frames_needing_attention: replacementFrames.length,
                average_productivity: stats.average_productivity,
                next_action: recommendations.immediate_actions.length > 0 ?
                    recommendations.immediate_actions[0] :
                    recommendations.maintenance_tasks[0] || null
            }
        };
    }

    /**
     * Track frame history and changes
     * @param {string} frameId - Frame ID
     * @param {string} userId - User ID
     * @returns {Promise<Object>}
     */
    async getFrameHistory(frameId, userId) {
        const frame = await this.getFrameById(frameId, userId);

        // This would typically involve a separate FrameHistory model
        // For now, we'll return basic information
        const history = {
            frame_id: frame.id,
            installation_date: frame.foundation_installed,
            age_days: frame.getAge(),
            total_inspections: frame.last_inspection ? 1 : 0, // Would be calculated from inspection records
            productivity_trend: 'stable', // Would be calculated from historical data
            replacement_history: [], // Would track previous replacements
            notable_events: []
        };

        // Add notable events based on current state
        if (frame.needs_replacement) {
            history.notable_events.push({
                date: frame.updated_at,
                event: 'marked_for_replacement',
                reason: frame.replacement_reason
            });
        }

        if (frame.wax_condition === 'black' || frame.wax_condition === 'damaged') {
            history.notable_events.push({
                date: frame.updated_at,
                event: 'poor_condition_detected',
                condition: frame.wax_condition
            });
        }

        return history;
    }

    /**
     * Validate frame content percentages
     * @param {Object} content - Frame content object
     * @private
     */
    validateFrameContent(content) {
        const brood = content.brood || {};
        const honey = content.honey || {};
        const pollen = content.pollen || {};
        const empty = content.empty || 0;

        const total = (brood.eggs || 0) + (brood.larvae || 0) + (brood.pupae || 0) +
            (honey.uncapped || 0) + (honey.capped || 0) + (pollen.stored || 0) + empty;

        if (total > 100) {
            throw new AppError('Total frame content cannot exceed 100%', 400, 'INVALID_CONTENT_PERCENTAGE');
        }

        // Validate individual percentages
        const percentages = [
            brood.eggs, brood.larvae, brood.pupae,
            honey.uncapped, honey.capped, pollen.stored, empty
        ];

        percentages.forEach(percentage => {
            if (percentage !== undefined && (percentage < 0 || percentage > 100)) {
                throw new AppError('Individual content percentages must be between 0 and 100', 400, 'INVALID_PERCENTAGE_RANGE');
            }
        });
    }

    /**
     * Generate frame-specific recommendations
     * @param {Frame} frame - Frame instance
     * @param {Object} analysis - Frame analysis data
     * @returns {Array}
     * @private
     */
    generateFrameRecommendations(frame, analysis) {
        const recommendations = [];

        // Replacement recommendations
        if (analysis.replacement_analysis.should) {
            recommendations.push({
                type: 'replacement',
                priority: analysis.replacement_analysis.priority,
                message: `يجب استبدال هذا الإطار - السبب: ${analysis.replacement_analysis.reason}`,
                action: 'replace_frame'
            });
        }

        // Productivity recommendations
        if (analysis.productivity_score < 50) {
            recommendations.push({
                type: 'productivity',
                priority: 'medium',
                message: 'إنتاجية الإطار منخفضة - تحقق من جودة الأساس الشمعي',
                action: 'inspect_foundation'
            });
        }

        // Brood pattern recommendations
        if (frame.type === 'brood' && analysis.health_indicators.brood_pattern === 'spotty') {
            recommendations.push({
                type: 'brood_health',
                priority: 'high',
                message: 'نمط الحضنة متقطع - قد يشير لمشكلة في الملكة أو مرض',
                action: 'check_queen_health'
            });
        }

        // Honey frame recommendations
        if (frame.type === 'honey' && analysis.content_breakdown.honey_percentage > 80) {
            recommendations.push({
                type: 'harvest',
                priority: 'medium',
                message: 'الإطار جاهز للقطف',
                action: 'harvest_honey'
            });
        }

        // Age-based recommendations
        const ageDays = analysis.health_indicators.age_days;
        if (ageDays && ageDays > 1095) { // 3 years
            recommendations.push({
                type: 'maintenance',
                priority: 'low',
                message: 'الإطار قديم - فكر في الاستبدال في الموسم القادم',
                action: 'plan_replacement'
            });
        }

        return recommendations;
    }
}

module.exports = new FrameService(); f.estima
teHoneyWeight(), 0) * 100
        ) / 100;

analysis.productive_frames = frames.filter(f => {
    const rating = f.getProductivityRating();
    return ['excellent', 'good'].includes(rating);
}).length;

analysis.average_comb_age = Math.round(
    frames.reduce((sum, f) => sum + f.comb_age, 0) / frames.length * 10
) / 10;
    }

// Get frames by super
const framesBySuper = {};
const broodFrames = frames.filter(f => !f.super_id);
if (broodFrames.length > 0) {
    framesBySuper['brood_chamber'] = {
        frames: broodFrames,
        total_frames: broodFrames.length,
        honey_frames: broodFrames.filter(f => f.type === 'honey').length,
        estimated_honey: Math.round(
            broodFrames.reduce((sum, f) => sum + (f.estimated_weight || 0), 0) * 100
        ) / 100
    };
}

const supers = [...new Set(frames.filter(f => f.super_id).map(f => f.super_id))];
for (const superId of supers) {
    const superFrames = frames.filter(f => f.super_id === superId);
    const superInfo = superFrames[0]?.super;
    framesBySuper[superId] = {
        super_info: superInfo,
        frames: superFrames,
        total_frames: superFrames.length,
        honey_frames: superFrames.filter(f => f.type === 'honey').length,
        estimated_honey: Math.round(
            superFrames.reduce((sum, f) => sum + (f.estimated_weight || 0), 0) * 100
        ) / 100
    };
}

analysis.frames_by_super = framesBySuper;

return analysis;
  }

  /**
   * Get frames needing attention
   * @param {string} hiveId - Hive ID
   * @param {string} userId - User ID
   * @returns {Promise<Array>}
   */
  async getFramesNeedingAttention(hiveId, userId) {
    // Verify user owns the hive
    const hive = await Hive.findOne({
        where: { id: hiveId },
        include: [{
            model: Apiary,
            as: 'apiary',
            where: { owner_id: userId }
        }]
    });

    if (!hive) {
        throw new AppError('Hive not found', 404, 'HIVE_NOT_FOUND');
    }

    const frames = await Frame.getFramesNeedingAttention(hiveId);

    return frames.map(frame => ({
        ...frame.toJSON(),
        urgency: frame.getReplacementUrgency(),
        productivity_rating: frame.getProductivityRating()
    }));
}

  /**
   * Schedule frame replacement
   * @param {string} frameId - Frame ID
   * @param {string} userId - User ID
   * @param {string} reason - Replacement reason
   * @returns {Promise<Frame>}
   */
  async scheduleFrameReplacement(frameId, userId, reason = 'routine_replacement') {
    const frame = await Frame.findOne({
        where: { id: frameId },
        include: [{
            model: Hive,
            as: 'hive',
            include: [{
                model: Apiary,
                as: 'apiary',
                where: { owner_id: userId }
            }]
        }]
    });

    if (!frame) {
        throw new AppError('Frame not found', 404, 'FRAME_NOT_FOUND');
    }

    const scheduleDate = frame.scheduleReplacement(reason);
    await frame.save();

    logger.info(`Scheduled frame replacement: ${frameId} for ${scheduleDate}`);
    return frame;
}

  /**
   * Replace frame with new one
   * @param {string} frameId - Frame ID to replace
   * @param {string} userId - User ID
   * @param {Object} newFrameData - New frame data
   * @returns {Promise<Frame>}
   */
  async replaceFrame(frameId, userId, newFrameData = {}) {
    const oldFrame = await Frame.findOne({
        where: { id: frameId },
        include: [{
            model: Hive,
            as: 'hive',
            include: [{
                model: Apiary,
                as: 'apiary',
                where: { owner_id: userId }
            }]
        }]
    });

    if (!oldFrame) {
        throw new AppError('Frame not found', 404, 'FRAME_NOT_FOUND');
    }

    // Create new frame with same position
    const newFrame = await Frame.create({
        hive_id: oldFrame.hive_id,
        super_id: oldFrame.super_id,
        position: oldFrame.position,
        type: 'foundation',
        foundation_type: newFrameData.foundation_type || 'wired',
        comb_condition: 'new',
        comb_age: 0,
        content_details: {
            brood_percentage: 0,
            honey_percentage: 0,
            pollen_percentage: 0,
            empty_percentage: 100
        },
        notes: `Replaced frame ${frameId} on ${new Date().toDateString()}. Reason: ${newFrameData.reason || 'replacement'}`
    });

    // Archive old frame (soft delete or move to history)
    await oldFrame.update({
        notes: (oldFrame.notes || '') + `\nFrame replaced on ${new Date().toDateString()} with ${newFrame.id}`
    });

    // In a real implementation, you might want to soft delete or move to history table
    await oldFrame.destroy();

    logger.info(`Replaced frame ${frameId} with new frame ${newFrame.id}`);
    return newFrame;
}

  /**
   * Move frame to different position
   * @param {string} frameId - Frame ID
   * @param {string} userId - User ID
   * @param {number} newPosition - New position
   * @param {string} newSuperId - New super ID (optional)
   * @returns {Promise<Frame>}
   */
  async moveFrame(frameId, userId, newPosition, newSuperId = null) {
    const frame = await Frame.findOne({
        where: { id: frameId },
        include: [{
            model: Hive,
            as: 'hive',
            include: [{
                model: Apiary,
                as: 'apiary',
                where: { owner_id: userId }
            }]
        }]
    });

    if (!frame) {
        throw new AppError('Frame not found', 404, 'FRAME_NOT_FOUND');
    }

    // Check if target position is available
    const existingFrame = await Frame.findOne({
        where: {
            hive_id: frame.hive_id,
            super_id: newSuperId,
            position: newPosition
        }
    });

    if (existingFrame && existingFrame.id !== frameId) {
        throw new AppError('Position already occupied', 400, 'POSITION_OCCUPIED');
    }

    const oldPosition = frame.position;
    const oldSuperId = frame.super_id;

    await frame.update({
        position: newPosition,
        super_id: newSuperId,
        notes: (frame.notes || '') + `\nMoved from position ${oldPosition} (super: ${oldSuperId}) to position ${newPosition} (super: ${newSuperId}) on ${new Date().toDateString()}`
    });

    logger.info(`Moved frame ${frameId} to position ${newPosition}`);
    return frame;
}

  /**
   * Get frame recommendations for hive
   * @param {string} hiveId - Hive ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>}
   */
  async getFrameRecommendations(hiveId, userId) {
    const analysis = await this.getHiveFrameAnalysis(hiveId, userId);
    const recommendations = [];

    // Check for frames needing immediate replacement
    if (analysis.condition_distribution.needs_replacement > 0) {
        recommendations.push({
            type: 'urgent',
            priority: 'high',
            title: 'إطارات تحتاج استبدال فوري',
            description: `${analysis.condition_distribution.needs_replacement} إطار يحتاج استبدال فوري`,
            action: 'replace_frames',
            frames_count: analysis.condition_distribution.needs_replacement
        });
    }

    // Check for old combs
    if (analysis.very_old_combs > 0) {
        recommendations.push({
            type: 'maintenance',
            priority: 'medium',
            title: 'أقراص شمعية قديمة جداً',
            description: `${analysis.very_old_combs} قرص شمعي عمره أكثر من 3 سنوات`,
            action: 'schedule_replacement',
            frames_count: analysis.very_old_combs
        });
    }

    // Check productivity
    const productivityRate = analysis.total_frames > 0 ?
        (analysis.productive_frames / analysis.total_frames) * 100 : 0;

    if (productivityRate < 60) {
        recommendations.push({
            type: 'productivity',
            priority: 'medium',
            title: 'انخفاض في إنتاجية الإطارات',
            description: `${Math.round(productivityRate)}% فقط من الإطارات منتجة`,
            action: 'improve_management',
            current_rate: Math.round(productivityRate)
        });
    }

    // Check for honey harvest opportunities
    if (analysis.type_distribution.honey > 5) {
        recommendations.push({
            type: 'harvest',
            priority: 'low',
            title: 'فرصة لقطف العسل',
            description: `${analysis.type_distribution.honey} إطار عسل جاهز للقطف`,
            action: 'harvest_honey',
            frames_count: analysis.type_distribution.honey,
            estimated_honey: analysis.total_estimated_honey
        });
    }

    // Check frame distribution balance
    const broodFrames = analysis.type_distribution.brood;
    const totalFrames = analysis.total_frames;
    const broodPercentage = totalFrames > 0 ? (broodFrames / totalFrames) * 100 : 0;

    if (broodPercentage < 30 && totalFrames > 8) {
        recommendations.push({
            type: 'balance',
            priority: 'medium',
            title: 'قلة إطارات الحضنة',
            description: `${Math.round(broodPercentage)}% فقط من الإطارات تحتوي على حضنة`,
            action: 'check_queen',
            current_percentage: Math.round(broodPercentage)
        });
    }

    return {
        analysis_summary: {
            total_frames: analysis.total_frames,
            productive_frames: analysis.productive_frames,
            frames_needing_attention: analysis.frames_needing_attention,
            average_quality: analysis.average_quality_score,
            estimated_honey: analysis.total_estimated_honey
        },
        recommendations: recommendations.sort((a, b) => {
            const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
            return priorityOrder[b.priority] - priorityOrder[a.priority];
        })
    };
}

  /**
   * Bulk update frames
   * @param {string} hiveId - Hive ID
   * @param {string} userId - User ID
   * @param {Array} updates - Array of frame updates
   * @returns {Promise<Array>}
   */
  async bulkUpdateFrames(hiveId, userId, updates) {
    // Verify user owns the hive
    const hive = await Hive.findOne({
        where: { id: hiveId },
        include: [{
            model: Apiary,
            as: 'apiary',
            where: { owner_id: userId }
        }]
    });

    if (!hive) {
        throw new AppError('Hive not found', 404, 'HIVE_NOT_FOUND');
    }

    const updatedFrames = [];

    for (const update of updates) {
        const frame = await Frame.findOne({
            where: {
                id: update.frame_id,
                hive_id: hiveId
            }
        });

        if (frame) {
            if (update.content_details) {
                frame.updateContent(update.content_details);
            }

            // Update other properties
            Object.keys(update).forEach(key => {
                if (key !== 'frame_id' && key !== 'content_details' && frame[key] !== undefined) {
                    frame[key] = update[key];
                }
            });

            await frame.save();
            updatedFrames.push(frame);
        }
    }

    logger.info(`Bulk updated ${updatedFrames.length} frames for hive ${hiveId}`);
    return updatedFrames;
}
}

module.exports = FrameService;