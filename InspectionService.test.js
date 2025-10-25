const { describe, it, expect, beforeEach, afterEach } = require('@jest/globals');
const InspectionService = require('../../src/server/services/InspectionService');
const { Inspection, Hive, Apiary, User } = require('../../src/server/models');
const { AppError } = require('../../src/server/middleware/errorHandler');

describe('InspectionService', () => {
    let inspectionService;
    let testUser;
    let testApiary;
    let testHive;

    beforeEach(async () => {
        inspectionService = new InspectionService();

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
            type: 'fixed'
        });

        // Create test hive
        testHive = await Hive.create({
            apiary_id: testApiary.id,
            name: 'Test Hive 1',
            type: 'langstroth',
            specifications: {
                frame_count: 10,
                frame_size: 'deep'
            },
            status: 'active'
        });
    });

    afterEach(async () => {
        // Clean up test data
        await Inspection.destroy({ where: {} });
        await Hive.destroy({ where: {} });
        await Apiary.destroy({ where: {} });
        await User.destroy({ where: {} });
    });

    describe('createInspection', () => {
        it('should create inspection successfully', async () => {
            const inspectionData = {
                inspection_type: 'routine',
                queen_present: 'yes',
                queen_laying: 'yes',
                brood_pattern: 'excellent',
                population_strength: 'strong',
                food_stores: 'adequate',
                notes: 'Good inspection'
            };

            const inspection = await inspectionService.createInspection(
                testHive.id,
                testUser.id,
                inspectionData
            );

            expect(inspection.hive_id).toBe(testHive.id);
            expect(inspection.inspector_id).toBe(testUser.id);
            expect(inspection.queen_present).toBe('yes');
            expect(inspection.auto_score).toBeGreaterThan(80);
            expect(inspection.overall_status).toBe('green');
        });

        it('should calculate correct auto score', async () => {
            const inspectionData = {
                queen_present: 'yes',
                queen_laying: 'yes',
                brood_pattern: 'excellent',
                population_strength: 'strong',
                food_stores: 'adequate'
            };

            const inspection = await inspectionService.createInspection(
                testHive.id,
                testUser.id,
                inspectionData
            );

            // Should get high score for all good answers
            expect(inspection.auto_score).toBeGreaterThan(85);
            expect(inspection.overall_status).toBe('green');
            expect(inspection.risk_level).toBe('low');
        });

        it('should handle poor inspection results', async () => {
            const inspectionData = {
                queen_present: 'no',
                queen_laying: 'no',
                brood_pattern: 'poor',
                population_strength: 'weak',
                food_stores: 'critical',
                diseases_found: ['varroa', 'nosema']
            };

            const inspection = await inspectionService.createInspection(
                testHive.id,
                testUser.id,
                inspectionData
            );

            expect(inspection.auto_score).toBeLessThan(40);
            expect(inspection.overall_status).toBe('red');
            expect(inspection.risk_level).toBe('critical');
        });

        it('should throw error for non-existent hive', async () => {
            const fakeHiveId = '123e4567-e89b-12d3-a456-426614174000';
            const inspectionData = { queen_present: 'yes' };

            await expect(
                inspectionService.createInspection(fakeHiveId, testUser.id, inspectionData)
            ).rejects.toThrow(AppError);
        });

        it('should throw error for unauthorized user', async () => {
            const otherUser = await User.create({
                name: 'Other User',
                email: 'other@example.com',
                password: 'hashedpassword',
                phone: '+9876543210'
            });

            const inspectionData = { queen_present: 'yes' };

            await expect(
                inspectionService.createInspection(testHive.id, otherUser.id, inspectionData)
            ).rejects.toThrow(AppError);

            await otherUser.destroy();
        });
    });

    describe('createQuickInspection', () => {
        it('should create quick inspection with 5 basic questions', async () => {
            const quickData = {
                queen_present: 'yes',
                queen_laying: 'yes',
                brood_pattern: 'good',
                population_strength: 'moderate',
                food_stores: 'adequate',
                notes: 'Quick inspection notes'
            };

            const inspection = await inspectionService.createQuickInspection(
                testHive.id,
                testUser.id,
                quickData
            );

            expect(inspection.inspection_type).toBe('routine');
            expect(inspection.queen_present).toBe('yes');
            expect(inspection.notes).toBe('Quick inspection notes');
            expect(inspection.auto_score).toBeGreaterThan(70);
        });
    });

    describe('getHiveInspectionHistory', () => {
        beforeEach(async () => {
            // Create multiple inspections
            const inspectionDates = [
                new Date('2024-01-01'),
                new Date('2024-01-15'),
                new Date('2024-02-01')
            ];

            for (let i = 0; i < inspectionDates.length; i++) {
                await Inspection.create({
                    hive_id: testHive.id,
                    inspector_id: testUser.id,
                    inspection_date: inspectionDates[i],
                    queen_present: 'yes',
                    queen_laying: 'yes',
                    brood_pattern: 'good',
                    population_strength: 'moderate',
                    food_stores: 'adequate'
                });
            }
        });

        it('should return inspection history in descending order', async () => {
            const history = await inspectionService.getHiveInspectionHistory(
                testHive.id,
                testUser.id
            );

            expect(history).toHaveLength(3);
            expect(new Date(history[0].inspection_date)).toBeInstanceOf(Date);
            expect(new Date(history[0].inspection_date).getTime())
                .toBeGreaterThan(new Date(history[1].inspection_date).getTime());
        });

        it('should filter by inspection type', async () => {
            // Create a disease check inspection
            await Inspection.create({
                hive_id: testHive.id,
                inspector_id: testUser.id,
                inspection_type: 'disease_check',
                queen_present: 'yes'
            });

            const history = await inspectionService.getHiveInspectionHistory(
                testHive.id,
                testUser.id,
                { type: 'disease_check' }
            );

            expect(history).toHaveLength(1);
            expect(history[0].inspection_type).toBe('disease_check');
        });

        it('should respect limit and offset', async () => {
            const history = await inspectionService.getHiveInspectionHistory(
                testHive.id,
                testUser.id,
                { limit: 2, offset: 1 }
            );

            expect(history).toHaveLength(2);
        });
    });

    describe('getHiveInspectionAnalytics', () => {
        beforeEach(async () => {
            // Create inspections with different scores over time
            const inspections = [
                { date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), score: 85 }, // 10 days ago
                { date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), score: 75 }, // 20 days ago
                { date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), score: 90 }  // 30 days ago
            ];

            for (const insp of inspections) {
                await Inspection.create({
                    hive_id: testHive.id,
                    inspector_id: testUser.id,
                    inspection_date: insp.date,
                    queen_present: 'yes',
                    queen_laying: 'yes',
                    brood_pattern: 'excellent',
                    population_strength: 'strong',
                    food_stores: 'adequate'
                });
            }
        });

        it('should provide comprehensive analytics', async () => {
            const analytics = await inspectionService.getHiveInspectionAnalytics(
                testHive.id,
                testUser.id,
                { days: 45 }
            );

            expect(analytics.total_inspections).toBe(3);
            expect(analytics.score_trend).toHaveLength(3);
            expect(analytics.average_score).toBeGreaterThan(80);
            expect(analytics.status_distribution).toBeDefined();
            expect(analytics.queen_trends).toBeDefined();
        });

        it('should handle no inspections gracefully', async () => {
            // Clear all inspections
            await Inspection.destroy({ where: { hive_id: testHive.id } });

            const analytics = await inspectionService.getHiveInspectionAnalytics(
                testHive.id,
                testUser.id
            );

            expect(analytics.total_inspections).toBe(0);
            expect(analytics.message).toContain('لا توجد فحوصات');
        });
    });

    describe('getOverdueInspections', () => {
        beforeEach(async () => {
            // Create an overdue inspection
            const pastDate = new Date();
            pastDate.setDate(pastDate.getDate() - 10); // 10 days ago

            const nextInspectionDate = new Date();
            nextInspectionDate.setDate(nextInspectionDate.getDate() - 5); // 5 days overdue

            await Inspection.create({
                hive_id: testHive.id,
                inspector_id: testUser.id,
                inspection_date: pastDate,
                next_inspection_date: nextInspectionDate,
                queen_present: 'yes',
                overall_status: 'yellow',
                risk_level: 'medium'
            });
        });

        it('should return overdue inspections', async () => {
            const overdueInspections = await inspectionService.getOverdueInspections(testUser.id);

            expect(overdueInspections).toHaveLength(1);
            expect(overdueInspections[0].hive.id).toBe(testHive.id);
            expect(overdueInspections[0].days_overdue).toBeGreaterThan(0);
        });
    });

    describe('getInspectionDashboard', () => {
        beforeEach(async () => {
            // Create recent inspections
            const recentDate = new Date();
            recentDate.setDate(recentDate.getDate() - 3);

            await Inspection.create({
                hive_id: testHive.id,
                inspector_id: testUser.id,
                inspection_date: recentDate,
                queen_present: 'yes',
                overall_status: 'green',
                risk_level: 'low'
            });
        });

        it('should provide dashboard overview', async () => {
            const dashboard = await inspectionService.getInspectionDashboard(testUser.id);

            expect(dashboard.total_hives).toBe(1);
            expect(dashboard.inspections_this_week).toBeGreaterThanOrEqual(0);
            expect(dashboard.inspections_this_month).toBeGreaterThanOrEqual(0);
            expect(dashboard.hive_status_overview).toBeDefined();
            expect(dashboard.quick_stats).toBeDefined();
            expect(dashboard.recent_inspections).toBeDefined();
        });
    });

    describe('generateInspectionReport', () => {
        let testInspection;

        beforeEach(async () => {
            testInspection = await Inspection.create({
                hive_id: testHive.id,
                inspector_id: testUser.id,
                inspection_type: 'routine',
                queen_present: 'yes',
                queen_laying: 'yes',
                brood_pattern: 'excellent',
                population_strength: 'strong',
                food_stores: 'adequate',
                notes: 'Detailed inspection notes',
                duration_minutes: 45,
                temperature_celsius: 25.5
            });
        });

        it('should generate comprehensive report', async () => {
            const report = await inspectionService.generateInspectionReport(
                testInspection.id,
                testUser.id
            );

            expect(report.inspection_info.id).toBe(testInspection.id);
            expect(report.inspection_info.duration).toBe(45);
            expect(report.hive_info.name).toBe(testHive.name);
            expect(report.assessment).toBeDefined();
            expect(report.detailed_findings).toBeDefined();
            expect(report.actions_and_recommendations).toBeDefined();
        });
    });

    describe('Inspection model methods', () => {
        let testInspection;

        beforeEach(async () => {
            testInspection = await Inspection.create({
                hive_id: testHive.id,
                inspector_id: testUser.id,
                queen_present: 'yes',
                queen_laying: 'yes',
                brood_pattern: 'excellent',
                population_strength: 'strong',
                food_stores: 'adequate'
            });
        });

        it('should calculate auto score correctly', () => {
            const score = testInspection.calculateAutoScore();
            expect(score).toBeGreaterThan(85);
        });

        it('should determine overall status correctly', () => {
            const status = testInspection.determineOverallStatus();
            expect(status).toBe('green');
        });

        it('should calculate risk level correctly', () => {
            const riskLevel = testInspection.calculateRiskLevel();
            expect(riskLevel).toBe('low');
        });

        it('should suggest next inspection date', () => {
            const nextDate = testInspection.suggestNextInspectionDate();
            expect(nextDate).toBeInstanceOf(Date);
            expect(nextDate.getTime()).toBeGreaterThan(testInspection.inspection_date.getTime());
        });

        it('should generate relevant recommendations', () => {
            const recommendations = testInspection.generateRecommendations();
            expect(Array.isArray(recommendations)).toBe(true);
        });

        it('should provide inspection summary', () => {
            const summary = testInspection.getInspectionSummary();
            expect(summary.id).toBe(testInspection.id);
            expect(summary.score).toBeDefined();
            expect(summary.status).toBeDefined();
            expect(summary.quick_assessment).toBeDefined();
            expect(summary.recommendations).toBeDefined();
        });
    });

    describe('Critical inspection scenarios', () => {
        it('should handle no queen scenario', async () => {
            const inspectionData = {
                queen_present: 'no',
                queen_laying: 'no',
                brood_pattern: 'none',
                population_strength: 'weak',
                food_stores: 'low'
            };

            const inspection = await inspectionService.createInspection(
                testHive.id,
                testUser.id,
                inspectionData
            );

            expect(inspection.overall_status).toBe('red');
            expect(inspection.risk_level).toBe('critical');

            const recommendations = inspection.generateRecommendations();
            expect(recommendations.some(r => r.includes('ملكة جديدة'))).toBe(true);
        });

        it('should handle disease outbreak scenario', async () => {
            const inspectionData = {
                queen_present: 'yes',
                queen_laying: 'poor',
                brood_pattern: 'poor',
                population_strength: 'moderate',
                food_stores: 'adequate',
                diseases_found: ['varroa', 'nosema', 'chalkbrood'],
                pests_found: ['wax_moth']
            };

            const inspection = await inspectionService.createInspection(
                testHive.id,
                testUser.id,
                inspectionData
            );

            expect(inspection.overall_status).toBe('orange');
            expect(inspection.auto_score).toBeLessThan(60);

            const recommendations = inspection.generateRecommendations();
            expect(recommendations.some(r => r.includes('العلاج'))).toBe(true);
        });
    });
});