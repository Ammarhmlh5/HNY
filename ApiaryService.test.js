const { describe, it, expect, beforeEach, afterEach } = require('@jest/globals');
const ApiaryService = require('../../src/server/services/ApiaryService');
const { Apiary, Hive, User, Inspection } = require('../../src/server/models');
const { AppError } = require('../../src/server/middleware/errorHandler');

describe('ApiaryService', () => {
    let apiaryService;
    let testUser;
    let otherUser;

    beforeEach(async () => {
        apiaryService = new ApiaryService();

        // Create test users
        testUser = await User.create({
            name: 'Test Beekeeper',
            email: 'test@example.com',
            password: 'hashedpassword',
            phone: '+1234567890'
        });

        otherUser = await User.create({
            name: 'Other Beekeeper',
            email: 'other@example.com',
            password: 'hashedpassword',
            phone: '+9876543210'
        });
    });

    afterEach(async () => {
        // Clean up test data
        await Inspection.destroy({ where: {} });
        await Hive.destroy({ where: {} });
        await Apiary.destroy({ where: {} });
        await User.destroy({ where: {} });
    });

    describe('createApiary', () => {
        it('should create apiary successfully', async () => {
            const apiaryData = {
                name: 'Test Apiary',
                type: 'fixed',
                location: {
                    latitude: 31.5,
                    longitude: 34.5,
                    address: 'Test Location'
                },
                area: 1000,
                capacity: 50,
                description: 'Test apiary description'
            };

            const apiary = await apiaryService.createApiary(testUser.id, apiaryData);

            expect(apiary.name).toBe('Test Apiary');
            expect(apiary.type).toBe('fixed');
            expect(apiary.owner_id).toBe(testUser.id);
            expect(apiary.location.latitude).toBe(31.5);
            expect(apiary.location.longitude).toBe(34.5);
        });

        it('should throw error for invalid user', async () => {
            const fakeUserId = '123e4567-e89b-12d3-a456-426614174000';
            const apiaryData = {
                name: 'Test Apiary',
                type: 'fixed',
                location: { latitude: 31.5, longitude: 34.5 }
            };

            await expect(
                apiaryService.createApiary(fakeUserId, apiaryData)
            ).rejects.toThrow(AppError);
        });

        it('should throw error for missing location', async () => {
            const apiaryData = {
                name: 'Test Apiary',
                type: 'fixed'
            };

            await expect(
                apiaryService.createApiary(testUser.id, apiaryData)
            ).rejects.toThrow(AppError);
        });
    });

    describe('getApiary', () => {
        let testApiary;

        beforeEach(async () => {
            testApiary = await Apiary.create({
                name: 'Test Apiary',
                owner_id: testUser.id,
                type: 'fixed',
                location: {
                    latitude: 31.5,
                    longitude: 34.5,
                    address: 'Test Location'
                }
            });
        });

        it('should get apiary successfully', async () => {
            const apiary = await apiaryService.getApiary(testApiary.id, testUser.id);

            expect(apiary.id).toBe(testApiary.id);
            expect(apiary.name).toBe('Test Apiary');
        });

        it('should include hives when requested', async () => {
            // Create a test hive
            await Hive.create({
                apiary_id: testApiary.id,
                name: 'Test Hive',
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
            });

            const apiary = await apiaryService.getApiary(testApiary.id, testUser.id, { includeHives: true });

            expect(apiary.hives).toBeDefined();
            expect(apiary.hives).toHaveLength(1);
        });

        it('should throw error for non-existent apiary', async () => {
            const fakeApiaryId = '123e4567-e89b-12d3-a456-426614174000';

            await expect(
                apiaryService.getApiary(fakeApiaryId, testUser.id)
            ).rejects.toThrow(AppError);
        });

        it('should throw error for unauthorized user', async () => {
            await expect(
                apiaryService.getApiary(testApiary.id, otherUser.id)
            ).rejects.toThrow(AppError);
        });
    });

    describe('updateApiary', () => {
        let testApiary;

        beforeEach(async () => {
            testApiary = await Apiary.create({
                name: 'Test Apiary',
                owner_id: testUser.id,
                type: 'mobile',
                location: {
                    latitude: 31.5,
                    longitude: 34.5,
                    address: 'Original Location'
                }
            });
        });

        it('should update apiary successfully', async () => {
            const updateData = {
                name: 'Updated Apiary',
                description: 'Updated description'
            };

            const updatedApiary = await apiaryService.updateApiary(testApiary.id, testUser.id, updateData);

            expect(updatedApiary.name).toBe('Updated Apiary');
            expect(updatedApiary.description).toBe('Updated description');
        });

        it('should record location history for mobile apiaries', async () => {
            const updateData = {
                location: {
                    latitude: 32.0,
                    longitude: 35.0,
                    address: 'New Location'
                }
            };

            const updatedApiary = await apiaryService.updateApiary(testApiary.id, testUser.id, updateData);

            expect(updatedApiary.location.latitude).toBe(32.0);
            expect(updatedApiary.location_history).toBeDefined();
        });
    });

    describe('deleteApiary', () => {
        let testApiary;

        beforeEach(async () => {
            testApiary = await Apiary.create({
                name: 'Test Apiary',
                owner_id: testUser.id,
                type: 'fixed',
                location: {
                    latitude: 31.5,
                    longitude: 34.5
                }
            });
        });

        it('should delete empty apiary successfully', async () => {
            await apiaryService.deleteApiary(testApiary.id, testUser.id);

            const deletedApiary = await Apiary.findByPk(testApiary.id);
            expect(deletedApiary).toBeNull();
        });

        it('should throw error when apiary has hives', async () => {
            // Create a hive in the apiary
            await Hive.create({
                apiary_id: testApiary.id,
                name: 'Test Hive',
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
            });

            await expect(
                apiaryService.deleteApiary(testApiary.id, testUser.id)
            ).rejects.toThrow(AppError);
        });
    });

    describe('getUserApiaries', () => {
        beforeEach(async () => {
            // Create multiple apiaries
            await Apiary.bulkCreate([
                {
                    name: 'Fixed Apiary 1',
                    owner_id: testUser.id,
                    type: 'fixed',
                    location: { latitude: 31.5, longitude: 34.5 }
                },
                {
                    name: 'Mobile Apiary 1',
                    owner_id: testUser.id,
                    type: 'mobile',
                    location: { latitude: 32.0, longitude: 35.0 }
                },
                {
                    name: 'Fixed Apiary 2',
                    owner_id: testUser.id,
                    type: 'fixed',
                    location: { latitude: 31.0, longitude: 34.0 }
                }
            ]);
        });

        it('should get all user apiaries', async () => {
            const apiaries = await apiaryService.getUserApiaries(testUser.id);

            expect(apiaries).toHaveLength(3);
        });

        it('should filter by type', async () => {
            const fixedApiaries = await apiaryService.getUserApiaries(testUser.id, { type: 'fixed' });
            const mobileApiaries = await apiaryService.getUserApiaries(testUser.id, { type: 'mobile' });

            expect(fixedApiaries).toHaveLength(2);
            expect(mobileApiaries).toHaveLength(1);
        });

        it('should respect limit and offset', async () => {
            const apiaries = await apiaryService.getUserApiaries(testUser.id, { limit: 2, offset: 1 });

            expect(apiaries).toHaveLength(2);
        });
    });

    describe('getApiaryStatistics', () => {
        let testApiary;

        beforeEach(async () => {
            testApiary = await Apiary.create({
                name: 'Test Apiary',
                owner_id: testUser.id,
                type: 'fixed',
                location: { latitude: 31.5, longitude: 34.5 },
                area: 1000
            });

            // Create test hives with different statuses
            const hives = await Hive.bulkCreate([
                {
                    apiary_id: testApiary.id,
                    name: 'Active Hive 1',
                    type: 'langstroth',
                    position: { row: 1, column: 1 },
                    specifications: { frame_count: 10, dimensions: { length: 50, width: 40, height: 25 } },
                    colony: { age: 12, queen_age: 6, source: 'purchased' },
                    status: 'active',
                    health_status: 'excellent',
                    frames: { brood: 5, honey: 3, waxed: 2 }
                },
                {
                    apiary_id: testApiary.id,
                    name: 'Active Hive 2',
                    type: 'langstroth',
                    position: { row: 1, column: 2 },
                    specifications: { frame_count: 10, dimensions: { length: 50, width: 40, height: 25 } },
                    colony: { age: 8, queen_age: 4, source: 'split' },
                    status: 'active',
                    health_status: 'good',
                    frames: { brood: 4, honey: 4, waxed: 2 }
                },
                {
                    apiary_id: testApiary.id,
                    name: 'Queenless Hive',
                    type: 'langstroth',
                    position: { row: 2, column: 1 },
                    specifications: { frame_count: 10, dimensions: { length: 50, width: 40, height: 25 } },
                    colony: { age: 6, queen_age: 0, source: 'purchased' },
                    status: 'queenless',
                    health_status: 'critical'
                }
            ]);

            // Associate hives with apiary
            testApiary.hives = hives;
        });

        it('should provide comprehensive statistics', async () => {
            const stats = await apiaryService.getApiaryStatistics(testApiary.id, testUser.id);

            expect(stats.total_hives).toBe(3);
            expect(stats.active_hives).toBe(2);
            expect(stats.inactive_hives).toBe(1);
            expect(stats.hive_status_distribution.active).toBe(2);
            expect(stats.hive_status_distribution.queenless).toBe(1);
            expect(stats.health_overview.excellent).toBe(1);
            expect(stats.health_overview.good).toBe(1);
            expect(stats.health_overview.critical).toBe(1);
        });

        it('should calculate productivity metrics', async () => {
            const stats = await apiaryService.getApiaryStatistics(testApiary.id, testUser.id);

            expect(stats.productivity_metrics).toBeDefined();
            expect(stats.productivity_metrics.hives_per_hectare).toBeGreaterThan(0);
            expect(stats.productivity_metrics.frames_per_hive).toBeGreaterThan(0);
        });
    });

    describe('getApiaryHealthReport', () => {
        let testApiary;

        beforeEach(async () => {
            testApiary = await Apiary.create({
                name: 'Test Apiary',
                owner_id: testUser.id,
                type: 'fixed',
                location: { latitude: 31.5, longitude: 34.5 }
            });

            // Create hives with health issues
            await Hive.bulkCreate([
                {
                    apiary_id: testApiary.id,
                    name: 'Healthy Hive',
                    type: 'langstroth',
                    position: { row: 1, column: 1 },
                    specifications: { frame_count: 10, dimensions: { length: 50, width: 40, height: 25 } },
                    colony: { age: 12, queen_age: 6, source: 'purchased' },
                    status: 'active',
                    health_status: 'excellent',
                    health_score: 35,
                    last_inspection: new Date()
                },
                {
                    apiary_id: testApiary.id,
                    name: 'Critical Hive',
                    type: 'langstroth',
                    position: { row: 1, column: 2 },
                    specifications: { frame_count: 10, dimensions: { length: 50, width: 40, height: 25 } },
                    colony: { age: 8, queen_age: 4, source: 'split' },
                    status: 'queenless',
                    health_status: 'critical',
                    health_score: 10
                }
            ]);
        });

        it('should provide health report with critical issues', async () => {
            const healthReport = await apiaryService.getApiaryHealthReport(testApiary.id, testUser.id);

            expect(healthReport.total_hives).toBe(2);
            expect(healthReport.critical_issues).toHaveLength(1);
            expect(healthReport.critical_issues[0].issue).toContain('ملكة');
            expect(healthReport.health_distribution.excellent).toBe(1);
            expect(healthReport.health_distribution.critical).toBe(1);
        });

        it('should calculate overall health score', async () => {
            const healthReport = await apiaryService.getApiaryHealthReport(testApiary.id, testUser.id);

            expect(healthReport.overall_health_score).toBeGreaterThan(0);
            expect(healthReport.recommendations).toBeDefined();
        });
    });

    describe('getNearbyApiaries', () => {
        beforeEach(async () => {
            // Create apiaries at different locations
            await Apiary.bulkCreate([
                {
                    name: 'Nearby Apiary 1',
                    owner_id: otherUser.id,
                    type: 'fixed',
                    location: { latitude: 31.51, longitude: 34.51 } // Very close
                },
                {
                    name: 'Nearby Apiary 2',
                    owner_id: otherUser.id,
                    type: 'fixed',
                    location: { latitude: 31.6, longitude: 34.6 } // Close
                },
                {
                    name: 'Far Apiary',
                    owner_id: otherUser.id,
                    type: 'fixed',
                    location: { latitude: 32.0, longitude: 35.0 } // Far
                }
            ]);
        });

        it('should find nearby apiaries within radius', async () => {
            const location = { latitude: 31.5, longitude: 34.5 };
            const nearbyApiaries = await apiaryService.getNearbyApiaries(testUser.id, location, 20);

            expect(nearbyApiaries.length).toBeGreaterThan(0);
            nearbyApiaries.forEach(apiary => {
                expect(apiary.distance_km).toBeLessThanOrEqual(20);
                expect(apiary.owner.id).not.toBe(testUser.id); // Should not include own apiaries
            });
        });

        it('should sort by distance', async () => {
            const location = { latitude: 31.5, longitude: 34.5 };
            const nearbyApiaries = await apiaryService.getNearbyApiaries(testUser.id, location, 50);

            if (nearbyApiaries.length > 1) {
                for (let i = 1; i < nearbyApiaries.length; i++) {
                    expect(nearbyApiaries[i].distance_km).toBeGreaterThanOrEqual(nearbyApiaries[i - 1].distance_km);
                }
            }
        });
    });

    describe('getApiaryRecommendations', () => {
        let testApiary;

        beforeEach(async () => {
            testApiary = await Apiary.create({
                name: 'Test Apiary',
                owner_id: testUser.id,
                type: 'fixed',
                location: { latitude: 31.5, longitude: 34.5 }
            });

            // Create a hive with issues
            await Hive.create({
                apiary_id: testApiary.id,
                name: 'Problem Hive',
                type: 'langstroth',
                position: { row: 1, column: 1 },
                specifications: { frame_count: 10, dimensions: { length: 50, width: 40, height: 25 } },
                colony: { age: 12, queen_age: 6, source: 'purchased' },
                status: 'queenless',
                health_status: 'critical'
            });
        });

        it('should provide relevant recommendations', async () => {
            const recommendations = await apiaryService.getApiaryRecommendations(testApiary.id, testUser.id);

            expect(recommendations.priority_actions).toBeDefined();
            expect(recommendations.management_suggestions).toBeDefined();
            expect(recommendations.expansion_opportunities).toBeDefined();
            expect(recommendations.seasonal_advice).toBeDefined();

            // Should have priority action for critical issue
            expect(recommendations.priority_actions.length).toBeGreaterThan(0);
        });

        it('should include seasonal advice', async () => {
            const recommendations = await apiaryService.getApiaryRecommendations(testApiary.id, testUser.id);

            expect(recommendations.seasonal_advice.season).toBeDefined();
            expect(recommendations.seasonal_advice.advice).toBeDefined();
            expect(Array.isArray(recommendations.seasonal_advice.advice)).toBe(true);
        });
    });

    describe('Helper methods', () => {
        it('should calculate distance correctly', () => {
            const distance = apiaryService.calculateDistance(31.5, 34.5, 31.51, 34.51);

            expect(distance).toBeGreaterThan(0);
            expect(distance).toBeLessThan(2); // Should be less than 2km for this small difference
        });

        it('should generate health recommendations', () => {
            const healthReport = {
                critical_issues: [
                    { hive_name: 'Test Hive', issue: 'خلية بدون ملكة', severity: 'critical' }
                ],
                health_distribution: { critical: 1, excellent: 0, good: 0, warning: 0 },
                overall_health_score: 15
            };

            const recommendations = apiaryService.generateHealthRecommendations(healthReport);

            expect(recommendations.length).toBeGreaterThan(0);
            expect(recommendations[0].priority).toBe('high');
        });

        it('should provide seasonal advice for all months', () => {
            for (let month = 1; month <= 12; month++) {
                const advice = apiaryService.getSeasonalAdvice(month);

                expect(advice.season).toBeDefined();
                expect(advice.advice).toBeDefined();
                expect(Array.isArray(advice.advice)).toBe(true);
            }
        });
    });
});