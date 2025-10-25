const { describe, it, expect, beforeEach, afterEach } = require('@jest/globals');
const HiveService = require('../../src/server/services/HiveService');
const { Hive, Apiary, User, Super, Frame, Inspection } = require('../../src/server/models');
const { AppError } = require('../../src/server/middleware/errorHandler');

describe('HiveService', () => {
    let hiveService;
    let testUser;
    let testApiary;

    beforeEach(async () => {
        hiveService = new HiveService();

        // Create test user
        testUser = await User.create({
            name: 'Test Beekeeper',
            email: 'test@example.com',
            password: 'hashedpassword',
            phone: '+1234567890'
        });

        // Create test apiary
        testApiary = await Apiary.create({
            name: 'Test Apiary',
            owner_id: testUser.id,
            location: {
                latitude: 31.5,
                longitude: 34.5,
                address: 'Test Location'
            },
            type: 'fixed',
            capacity: 50
        });
    });

    afterEach(async () => {
        // Clean up test data
        await Inspection.destroy({ where: {} });
        await Frame.destroy({ where: {} });
        await Super.destroy({ where: {} });
        await Hive.destroy({ where: {} });
        await Apiary.destroy({ where: {} });
        await User.destroy({ where: {} });
    });

    describe('createHive', () => {
        it('should create hive successfully', async () => {
            const hiveData = {
                name: 'Test Hive 1',
                type: 'langstroth',
                position: { row: 1, column: 1 },
                specifications: {
                    frame_count: 10,
                    dimensions: { length: 50, width: 40, height: 25 }
                },
                colony: {
                    age: 12,
                    queen_age: 6,
                    source: 'purchased'
                }
            };

            const hive = await hiveService.createHive(testApiary.id, testUser.id, hiveData);

            expect(hive.name).toBe('Test Hive 1');
            expect(hive.type).toBe('langstroth');
            expect(hive.apiary_id).toBe(testApiary.id);
            expect(hive.position.row).toBe(1);
            expect(hive.position.column).toBe(1);
        });

        it('should throw error for non-existent apiary', async () => {
            const fakeApiaryId = '123e4567-e89b-12d3-a456-426614174000';
            const hiveData = {
                name: 'Test Hive',
                type: 'langstroth',
                position: { row: 1, column: 1 },
                specifications: { frame_count: 10, dimensions: {} },
                colony: { age: 12, queen_age: 6, source: 'purchased' }
            };

            await expect(
                hiveService.createHive(fakeApiaryId, testUser.id, hiveData)
            ).rejects.toThrow(AppError);
        });

        it('should throw error for occupied position', async () => {
            const hiveData = {
                name: 'Test Hive 1',
                type: 'langstroth',
                position: { row: 1, column: 1 },
                specifications: { frame_count: 10, dimensions: {} },
                colony: { age: 12, queen_age: 6, source: 'purchased' }
            };

            // Create first hive
            await hiveService.createHive(testApiary.id, testUser.id, hiveData);

            // Try to create second hive at same position
            const hiveData2 = { ...hiveData, name: 'Test Hive 2' };

            await expect(
                hiveService.createHive(testApiary.id, testUser.id, hiveData2)
            ).rejects.toThrow(AppError);
        });

        it('should throw error when apiary is at capacity', async () => {
            // Update apiary capacity to 1
            await testApiary.update({ capacity: 1 });

            const hiveData = {
                name: 'Test Hive 1',
                type: 'langstroth',
                position: { row: 1, column: 1 },
                specifications: { frame_count: 10, dimensions: {} },
                colony: { age: 12, queen_age: 6, source: 'purchased' }
            };

            // Create first hive
            await hiveService.createHive(testApiary.id, testUser.id, hiveData);

            // Try to create second hive
            const hiveData2 = { ...hiveData, name: 'Test Hive 2', position: { row: 1, column: 2 } };

            await expect(
                hiveService.createHive(testApiary.id, testUser.id, hiveData2)
            ).rejects.toThrow(AppError);
        });
    });

    describe('getHive', () => {
        let testHive;

        beforeEach(async () => {
            testHive = await Hive.create({
                apiary_id: testApiary.id,
                name: 'Test Hive',
                type: 'langstroth',
                position: { row: 1, column: 1 },
                specifications: { frame_count: 10, dimensions: {} },
                colony: { age: 12, queen_age: 6, source: 'purchased' }
            });
        });

        it('should get hive successfully', async () => {
            const hive = await hiveService.getHive(testHive.id, testUser.id);

            expect(hive.id).toBe(testHive.id);
            expect(hive.name).toBe('Test Hive');
            expect(hive.apiary).toBeDefined();
        });

        it('should include supers when requested', async () => {
            // Create a super
            await Super.create({
                hive_id: testHive.id,
                type: 'medium',
                frame_count: 8,
                position: 1,
                purpose: 'honey'
            });

            const hive = await hiveService.getHive(testHive.id, testUser.id, { includeSupers: true });

            expect(hive.supers).toBeDefined();
            expect(hive.supers).toHaveLength(1);
        });

        it('should include frames when requested', async () => {
            // Create frames
            await Frame.create({
                hive_id: testHive.id,
                position: 1,
                type: 'foundation',
                foundation_type: 'wired',
                comb_condition: 'new'
            });

            const hive = await hiveService.getHive(testHive.id, testUser.id, { includeFrames: true });

            expect(hive.frames).toBeDefined();
            expect(hive.frames).toHaveLength(1);
        });

        it('should include inspections when requested', async () => {
            // Create inspection
            await Inspection.create({
                hive_id: testHive.id,
                inspector_id: testUser.id,
                queen_present: 'yes',
                queen_laying: 'yes',
                brood_pattern: 'excellent',
                population_strength: 'strong',
                food_stores: 'adequate'
            });

            const hive = await hiveService.getHive(testHive.id, testUser.id, { includeInspections: true });

            expect(hive.inspections).toBeDefined();
            expect(hive.inspections).toHaveLength(1);
        });

        it('should throw error for non-existent hive', async () => {
            const fakeHiveId = '123e4567-e89b-12d3-a456-426614174000';

            await expect(
                hiveService.getHive(fakeHiveId, testUser.id)
            ).rejects.toThrow(AppError);
        });

        it('should throw error for unauthorized user', async () => {
            const otherUser = await User.create({
                name: 'Other User',
                email: 'other@example.com',
                password: 'hashedpassword',
                phone: '+9876543210'
            });

            await expect(
                hiveService.getHive(testHive.id, otherUser.id)
            ).rejects.toThrow(AppError);

            await otherUser.destroy();
        });
    });

    describe('updateHive', () => {
        let testHive;

        beforeEach(async () => {
            testHive = await Hive.create({
                apiary_id: testApiary.id,
                name: 'Test Hive',
                type: 'langstroth',
                position: { row: 1, column: 1 },
                specifications: { frame_count: 10, dimensions: {} },
                colony: { age: 12, queen_age: 6, source: 'purchased' }
            });
        });

        it('should update hive successfully', async () => {
            const updateData = {
                name: 'Updated Hive',
                status: 'active'
            };

            const updatedHive = await hiveService.updateHive(testHive.id, testUser.id, updateData);

            expect(updatedHive.name).toBe('Updated Hive');
            expect(updatedHive.status).toBe('active');
        });

        it('should update position successfully', async () => {
            const updateData = {
                position: { row: 2, column: 2 }
            };

            const updatedHive = await hiveService.updateHive(testHive.id, testUser.id, updateData);

            expect(updatedHive.position.row).toBe(2);
            expect(updatedHive.position.column).toBe(2);
        });

        it('should throw error for occupied position', async () => {
            // Create another hive
            await Hive.create({
                apiary_id: testApiary.id,
                name: 'Other Hive',
                type: 'langstroth',
                position: { row: 2, column: 2 },
                specifications: { frame_count: 10, dimensions: {} },
                colony: { age: 12, queen_age: 6, source: 'purchased' }
            });

            const updateData = {
                position: { row: 2, column: 2 }
            };

            await expect(
                hiveService.updateHive(testHive.id, testUser.id, updateData)
            ).rejects.toThrow(AppError);
        });
    });

    describe('deleteHive', () => {
        let testHive;

        beforeEach(async () => {
            testHive = await Hive.create({
                apiary_id: testApiary.id,
                name: 'Test Hive',
                type: 'langstroth',
                position: { row: 1, column: 1 },
                specifications: { frame_count: 10, dimensions: {} },
                colony: { age: 12, queen_age: 6, source: 'purchased' }
            });
        });

        it('should delete empty hive successfully', async () => {
            await hiveService.deleteHive(testHive.id, testUser.id);

            const deletedHive = await Hive.findByPk(testHive.id);
            expect(deletedHive).toBeNull();
        });

        it('should throw error when hive has supers', async () => {
            // Create a super
            await Super.create({
                hive_id: testHive.id,
                type: 'medium',
                frame_count: 8,
                position: 1,
                purpose: 'honey'
            });

            await expect(
                hiveService.deleteHive(testHive.id, testUser.id)
            ).rejects.toThrow(AppError);
        });

        it('should throw error when hive has frames', async () => {
            // Create a frame
            await Frame.create({
                hive_id: testHive.id,
                position: 1,
                type: 'foundation',
                foundation_type: 'wired',
                comb_condition: 'new'
            });

            await expect(
                hiveService.deleteHive(testHive.id, testUser.id)
            ).rejects.toThrow(AppError);
        });
    });

    describe('getHiveStatistics', () => {
        let testHive;

        beforeEach(async () => {
            testHive = await Hive.create({
                apiary_id: testApiary.id,
                name: 'Test Hive',
                type: 'langstroth',
                position: { row: 1, column: 1 },
                specifications: { frame_count: 10, dimensions: {} },
                colony: { age: 12, queen_age: 6, source: 'purchased' },
                health_status: 'good',
                health_score: 30,
                last_inspection: new Date()
            });

            // Create supers and frames
            const super1 = await Super.create({
                hive_id: testHive.id,
                type: 'medium',
                frame_count: 8,
                position: 1,
                purpose: 'honey'
            });

            await Frame.bulkCreate([
                {
                    hive_id: testHive.id,
                    position: 1,
                    type: 'brood',
                    foundation_type: 'wired',
                    comb_condition: 'good'
                },
                {
                    hive_id: testHive.id,
                    super_id: super1.id,
                    position: 1,
                    type: 'honey',
                    foundation_type: 'wired',
                    comb_condition: 'good',
                    estimated_weight: 2.5
                }
            ]);

            // Create inspections
            await Inspection.bulkCreate([
                {
                    hive_id: testHive.id,
                    inspector_id: testUser.id,
                    inspection_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
                    auto_score: 85,
                    overall_status: 'green'
                },
                {
                    hive_id: testHive.id,
                    inspector_id: testUser.id,
                    inspection_date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
                    auto_score: 80,
                    overall_status: 'green'
                }
            ]);
        });

        it('should provide comprehensive statistics', async () => {
            const stats = await hiveService.getHiveStatistics(testHive.id, testUser.id);

            expect(stats.hive_info.id).toBe(testHive.id);
            expect(stats.hive_info.name).toBe('Test Hive');
            expect(stats.structure.total_supers).toBe(1);
            expect(stats.structure.total_frames).toBe(2);
            expect(stats.structure.brood_chamber_frames).toBe(1);
            expect(stats.structure.super_frames).toBe(1);
            expect(stats.production.estimated_honey_kg).toBe(2.5);
            expect(stats.inspection_trends.total_inspections).toBe(2);
        });

        it('should calculate health trends correctly', async () => {
            const stats = await hiveService.getHiveStatistics(testHive.id, testUser.id);

            expect(stats.inspection_trends.recent_scores).toHaveLength(2);
            expect(stats.inspection_trends.health_trend).toBe('improving');
        });

        it('should handle hive with no frames', async () => {
            // Delete all frames
            await Frame.destroy({ where: { hive_id: testHive.id } });

            const stats = await hiveService.getHiveStatistics(testHive.id, testUser.id);

            expect(stats.structure.total_frames).toBe(0);
            expect(stats.production.estimated_honey_kg).toBe(0);
        });
    });

    describe('getHiveRecommendations', () => {
        let testHive;

        beforeEach(async () => {
            testHive = await Hive.create({
                apiary_id: testApiary.id,
                name: 'Test Hive',
                type: 'langstroth',
                position: { row: 1, column: 1 },
                specifications: { frame_count: 10, dimensions: {} },
                colony: { age: 12, queen_age: 6, source: 'purchased' },
                status: 'active',
                health_status: 'good'
            });
        });

        it('should provide recommendations for healthy hive', async () => {
            const recommendations = await hiveService.getHiveRecommendations(testHive.id, testUser.id);

            expect(recommendations.urgent_actions).toBeDefined();
            expect(recommendations.management_suggestions).toBeDefined();
            expect(recommendations.seasonal_advice).toBeDefined();
            expect(recommendations.expansion_opportunities).toBeDefined();
            expect(recommendations.health_monitoring).toBeDefined();
        });

        it('should provide urgent actions for queenless hive', async () => {
            await testHive.update({ status: 'queenless' });

            const recommendations = await hiveService.getHiveRecommendations(testHive.id, testUser.id);

            expect(recommendations.urgent_actions.length).toBeGreaterThan(0);
            expect(recommendations.urgent_actions[0].priority).toBe('critical');
            expect(recommendations.urgent_actions[0].action).toContain('ملكة');
        });

        it('should provide health monitoring for critical status', async () => {
            await testHive.update({ health_status: 'critical' });

            const recommendations = await hiveService.getHiveRecommendations(testHive.id, testUser.id);

            expect(recommendations.urgent_actions.length).toBeGreaterThan(0);
            expect(recommendations.urgent_actions.some(a => a.action.includes('فحص طبي'))).toBe(true);
        });
    });

    describe('manageHiveSupers', () => {
        let testHive;

        beforeEach(async () => {
            testHive = await Hive.create({
                apiary_id: testApiary.id,
                name: 'Test Hive',
                type: 'langstroth',
                position: { row: 1, column: 1 },
                specifications: { frame_count: 10, dimensions: {} },
                colony: { age: 12, queen_age: 6, source: 'purchased' }
            });
        });

        it('should add super successfully', async () => {
            const options = {
                action: 'add_super',
                superData: {
                    type: 'medium',
                    frame_count: 8,
                    purpose: 'honey'
                }
            };

            const result = await hiveService.manageHiveSupers(testHive.id, testUser.id, options);

            expect(result.action_taken).toBe('add_super');
            expect(result.new_super_id).toBeDefined();
            expect(result.after_state.super_count).toBe(1);
        });

        it('should remove super successfully', async () => {
            // Create a super first
            const super1 = await Super.create({
                hive_id: testHive.id,
                type: 'medium',
                frame_count: 8,
                position: 1,
                purpose: 'honey'
            });

            const options = {
                action: 'remove_super',
                superData: {
                    super_id: super1.id
                }
            };

            const result = await hiveService.manageHiveSupers(testHive.id, testUser.id, options);

            expect(result.action_taken).toBe('remove_super');
            expect(result.removed_super_id).toBe(super1.id);
            expect(result.after_state.super_count).toBe(0);
        });

        it('should throw error when removing super with frames', async () => {
            // Create a super with frames
            const super1 = await Super.create({
                hive_id: testHive.id,
                type: 'medium',
                frame_count: 8,
                position: 1,
                purpose: 'honey'
            });

            await Frame.create({
                hive_id: testHive.id,
                super_id: super1.id,
                position: 1,
                type: 'foundation',
                foundation_type: 'wired',
                comb_condition: 'new'
            });

            const options = {
                action: 'remove_super',
                superData: {
                    super_id: super1.id
                }
            };

            await expect(
                hiveService.manageHiveSupers(testHive.id, testUser.id, options)
            ).rejects.toThrow(AppError);
        });

        it('should reorder supers successfully', async () => {
            // Create multiple supers
            const super1 = await Super.create({
                hive_id: testHive.id,
                type: 'medium',
                frame_count: 8,
                position: 1,
                purpose: 'honey'
            });

            const super2 = await Super.create({
                hive_id: testHive.id,
                type: 'shallow',
                frame_count: 8,
                position: 2,
                purpose: 'honey'
            });

            const options = {
                action: 'reorder_supers',
                superData: {
                    new_order: [super2.id, super1.id]
                }
            };

            const result = await hiveService.manageHiveSupers(testHive.id, testUser.id, options);

            expect(result.action_taken).toBe('reorder_supers');
            expect(result.new_order).toEqual([super2.id, super1.id]);
        });
    });

    describe('calculateHivePerformance', () => {
        let testHive;

        beforeEach(async () => {
            testHive = await Hive.create({
                apiary_id: testApiary.id,
                name: 'Test Hive',
                type: 'langstroth',
                position: { row: 1, column: 1 },
                specifications: { frame_count: 10, dimensions: {} },
                colony: { age: 12, queen_age: 6, source: 'purchased' }
            });

            // Create inspections over time
            const dates = [
                new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
                new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
                new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)  // 90 days ago
            ];

            for (let i = 0; i < dates.length; i++) {
                await Inspection.create({
                    hive_id: testHive.id,
                    inspector_id: testUser.id,
                    inspection_date: dates[i],
                    auto_score: 80 + (i * 5), // Improving scores
                    overall_status: 'green'
                });
            }
        });

        it('should calculate performance metrics', async () => {
            const performance = await hiveService.calculateHivePerformance(
                testHive.id,
                testUser.id,
                { period: 'quarter' }
            );

            expect(performance.period).toBe('quarter');
            expect(performance.hive_info.id).toBe(testHive.id);
            expect(performance.health_metrics.average_score).toBeGreaterThan(0);
            expect(performance.health_metrics.score_trend).toBe('improving');
            expect(performance.management_metrics.inspection_frequency).toBeGreaterThan(0);
        });

        it('should handle different time periods', async () => {
            const monthPerformance = await hiveService.calculateHivePerformance(
                testHive.id,
                testUser.id,
                { period: 'month' }
            );

            const yearPerformance = await hiveService.calculateHivePerformance(
                testHive.id,
                testUser.id,
                { period: 'year' }
            );

            expect(monthPerformance.period).toBe('month');
            expect(yearPerformance.period).toBe('year');
        });
    });

    describe('compareHiveWithApiary', () => {
        let testHive1, testHive2, testHive3;

        beforeEach(async () => {
            // Create multiple hives with different health scores
            testHive1 = await Hive.create({
                apiary_id: testApiary.id,
                name: 'Best Hive',
                type: 'langstroth',
                position: { row: 1, column: 1 },
                specifications: { frame_count: 10, dimensions: {} },
                colony: { age: 12, queen_age: 6, source: 'purchased' },
                health_score: 35,
                health_status: 'excellent'
            });

            testHive2 = await Hive.create({
                apiary_id: testApiary.id,
                name: 'Average Hive',
                type: 'langstroth',
                position: { row: 1, column: 2 },
                specifications: { frame_count: 10, dimensions: {} },
                colony: { age: 12, queen_age: 6, source: 'purchased' },
                health_score: 25,
                health_status: 'good'
            });

            testHive3 = await Hive.create({
                apiary_id: testApiary.id,
                name: 'Poor Hive',
                type: 'langstroth',
                position: { row: 1, column: 3 },
                specifications: { frame_count: 10, dimensions: {} },
                colony: { age: 12, queen_age: 6, source: 'purchased' },
                health_score: 15,
                health_status: 'warning'
            });
        });

        it('should compare hive with apiary correctly', async () => {
            const comparison = await hiveService.compareHiveWithApiary(testHive1.id, testUser.id);

            expect(comparison.target_hive.id).toBe(testHive1.id);
            expect(comparison.apiary_stats.total_hives).toBe(3);
            expect(comparison.apiary_stats.average_health_score).toBe(25); // (35+25+15)/3
            expect(comparison.rankings.health_rank).toBe(1); // Best hive
            expect(comparison.rankings.percentile).toBeGreaterThan(50);
        });

        it('should provide recommendations based on ranking', async () => {
            const topComparison = await hiveService.compareHiveWithApiary(testHive1.id, testUser.id);
            const bottomComparison = await hiveService.compareHiveWithApiary(testHive3.id, testUser.id);

            expect(topComparison.recommendations.some(r => r.type === 'excellent_performance')).toBe(true);
            expect(bottomComparison.recommendations.some(r => r.type === 'improvement_needed')).toBe(true);
        });
    });

    describe('Helper methods', () => {
        it('should calculate hive age correctly', () => {
            const age = hiveService.calculateHiveAge(12);
            expect(age).toBe(12);
        });

        it('should calculate seasonal productivity', () => {
            const testHive = { colony: { age: 12 } };

            // Test different months
            const springProductivity = hiveService.calculateSeasonalProductivity(testHive);
            expect(springProductivity).toBeGreaterThan(0);
            expect(springProductivity).toBeLessThanOrEqual(1);
        });

        it('should provide seasonal advice for all months', () => {
            const stats = {
                production: { capacity_utilization: 50 },
                health: { current_status: 'good' }
            };

            for (let month = 1; month <= 12; month++) {
                const advice = hiveService.getSeasonalHiveAdvice(month, stats);

                expect(advice.actions).toBeDefined();
                expect(advice.focus).toBeDefined();
                expect(Array.isArray(advice.actions)).toBe(true);
            }
        });
    });
});