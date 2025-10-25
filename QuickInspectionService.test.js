const request = require('supertest');
const app = require('../../src/server/app');
const { User, Hive, Apiary, Inspection } = require('../../src/server/models');
const jwt = require('jsonwebtoken');

describe('Quick Inspection Service', () => {
    let user, apiary, hive, authToken;

    beforeEach(async () => {
        // Create test user
        user = await User.create({
            name: 'Test Beekeeper',
            email: 'test@example.com',
            password: 'password123',
            phone: '1234567890'
        });

        // Generate auth token
        authToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'test-secret');

        // Create test apiary
        apiary = await Apiary.create({
            name: 'Test Apiary',
            location: 'Test Location',
            user_id: user.id,
            latitude: 24.7136,
            longitude: 46.6753
        });

        // Create test hive
        hive = await Hive.create({
            name: 'Test Hive 1',
            apiary_id: apiary.id,
            user_id: user.id,
            hive_type: 'langstroth',
            status: 'active'
        });
    });

    afterEach(async () => {
        await Inspection.destroy({ where: {} });
        await Hive.destroy({ where: {} });
        await Apiary.destroy({ where: {} });
        await User.destroy({ where: {} });
    });

    describe('POST /api/inspections/hive/:hiveId/quick', () => {
        const validQuickInspectionData = {
            queen_present: 'yes',
            queen_laying: 'yes',
            brood_pattern: 'excellent',
            population_strength: 'strong',
            food_stores: 'adequate',
            notes: 'Test quick inspection',
            field_mode: true,
            duration_minutes: 5
        };

        it('should create a quick inspection successfully', async () => {
            const response = await request(app)
                .post(`/api/inspections/hive/${hive.id}/quick`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(validQuickInspectionData)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('inspection_id');
            expect(response.body.data).toHaveProperty('summary');
            expect(response.body.data).toHaveProperty('recommendations');
            expect(response.body.data).toHaveProperty('next_inspection_date');

            // Check summary
            expect(response.body.data.summary.score).toBeGreaterThan(80);
            expect(response.body.data.summary.status).toBe('green');

            // Check recommendations
            expect(Array.isArray(response.body.data.recommendations)).toBe(true);
            expect(response.body.data.recommendations.length).toBeGreaterThan(0);
        });

        it('should calculate correct score for excellent conditions', async () => {
            const excellentData = {
                queen_present: 'yes',
                queen_laying: 'yes',
                brood_pattern: 'excellent',
                population_strength: 'very_strong',
                food_stores: 'abundant'
            };

            const response = await request(app)
                .post(`/api/inspections/hive/${hive.id}/quick`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(excellentData)
                .expect(201);

            expect(response.body.data.summary.score).toBe(100);
            expect(response.body.data.summary.status).toBe('green');
        });

        it('should calculate correct score for poor conditions', async () => {
            const poorData = {
                queen_present: 'no',
                queen_laying: 'no',
                brood_pattern: 'poor',
                population_strength: 'very_weak',
                food_stores: 'none'
            };

            const response = await request(app)
                .post(`/api/inspections/hive/${hive.id}/quick`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(poorData)
                .expect(201);

            expect(response.body.data.summary.score).toBeLessThan(20);
            expect(response.body.data.summary.status).toBe('red');

            // Should have critical recommendations
            const recommendations = response.body.data.recommendations;
            expect(recommendations.some(rec => rec.includes('فوراً') || rec.includes('عاجل'))).toBe(true);
        });

        it('should generate appropriate recommendations for different conditions', async () => {
            const testCases = [
                {
                    data: { queen_present: 'no', queen_laying: 'no', brood_pattern: 'none', population_strength: 'weak', food_stores: 'critical' },
                    expectedKeywords: ['ملكة', 'فوراً', 'تغذية']
                },
                {
                    data: { queen_present: 'yes', queen_laying: 'poor', brood_pattern: 'fair', population_strength: 'moderate', food_stores: 'low' },
                    expectedKeywords: ['ضعيف', 'تغذية']
                }
            ];

            for (const testCase of testCases) {
                const response = await request(app)
                    .post(`/api/inspections/hive/${hive.id}/quick`)
                    .set('Authorization', `Bearer ${authToken}`)
                    .send(testCase.data)
                    .expect(201);

                const recommendations = response.body.data.recommendations.join(' ');

                testCase.expectedKeywords.forEach(keyword => {
                    expect(recommendations).toContain(keyword);
                });
            }
        });

        it('should set appropriate next inspection date based on status', async () => {
            const testCases = [
                { status: 'red', maxDays: 5 },
                { status: 'orange', maxDays: 10 },
                { status: 'yellow', maxDays: 16 },
                { status: 'green', maxDays: 25 }
            ];

            for (const testCase of testCases) {
                let data;
                switch (testCase.status) {
                    case 'red':
                        data = { queen_present: 'no', queen_laying: 'no', brood_pattern: 'none', population_strength: 'very_weak', food_stores: 'none' };
                        break;
                    case 'orange':
                        data = { queen_present: 'not_seen', queen_laying: 'poor', brood_pattern: 'poor', population_strength: 'weak', food_stores: 'critical' };
                        break;
                    case 'yellow':
                        data = { queen_present: 'yes', queen_laying: 'yes', brood_pattern: 'fair', population_strength: 'moderate', food_stores: 'adequate' };
                        break;
                    case 'green':
                        data = { queen_present: 'yes', queen_laying: 'yes', brood_pattern: 'excellent', population_strength: 'very_strong', food_stores: 'abundant' };
                        break;
                }

                const response = await request(app)
                    .post(`/api/inspections/hive/${hive.id}/quick`)
                    .set('Authorization', `Bearer ${authToken}`)
                    .send(data)
                    .expect(201);

                const nextInspectionDate = new Date(response.body.data.next_inspection_date);
                const today = new Date();
                const daysDifference = Math.ceil((nextInspectionDate - today) / (1000 * 60 * 60 * 24));

                expect(daysDifference).toBeLessThanOrEqual(testCase.maxDays);
                expect(daysDifference).toBeGreaterThan(0);
            }
        });

        it('should validate required fields', async () => {
            const invalidData = {
                queen_present: 'invalid_value',
                // missing other required fields
            };

            const response = await request(app)
                .post(`/api/inspections/hive/${hive.id}/quick`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(invalidData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.errors).toBeDefined();
        });

        it('should require authentication', async () => {
            await request(app)
                .post(`/api/inspections/hive/${hive.id}/quick`)
                .send(validQuickInspectionData)
                .expect(401);
        });

        it('should verify hive ownership', async () => {
            // Create another user
            const otherUser = await User.create({
                name: 'Other User',
                email: 'other@example.com',
                password: 'password123',
                phone: '0987654321'
            });

            const otherToken = jwt.sign({ userId: otherUser.id }, process.env.JWT_SECRET || 'test-secret');

            const response = await request(app)
                .post(`/api/inspections/hive/${hive.id}/quick`)
                .set('Authorization', `Bearer ${otherToken}`)
                .send(validQuickInspectionData)
                .expect(404);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('غير موجودة');

            await User.destroy({ where: { id: otherUser.id } });
        });

        it('should handle optional fields correctly', async () => {
            const minimalData = {
                queen_present: 'yes',
                queen_laying: 'yes',
                brood_pattern: 'good',
                population_strength: 'strong',
                food_stores: 'adequate'
            };

            const response = await request(app)
                .post(`/api/inspections/hive/${hive.id}/quick`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(minimalData)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.data.inspection_id).toBeDefined();
        });

        it('should store inspection data correctly in database', async () => {
            const response = await request(app)
                .post(`/api/inspections/hive/${hive.id}/quick`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(validQuickInspectionData)
                .expect(201);

            const inspectionId = response.body.data.inspection_id;
            const inspection = await Inspection.findByPk(inspectionId);

            expect(inspection).toBeTruthy();
            expect(inspection.hive_id).toBe(hive.id);
            expect(inspection.user_id).toBe(user.id);
            expect(inspection.inspection_type).toBe('routine');
            expect(inspection.queen_present).toBe(validQuickInspectionData.queen_present);
            expect(inspection.queen_laying).toBe(validQuickInspectionData.queen_laying);
            expect(inspection.brood_pattern).toBe(validQuickInspectionData.brood_pattern);
            expect(inspection.population_strength).toBe(validQuickInspectionData.population_strength);
            expect(inspection.food_stores).toBe(validQuickInspectionData.food_stores);
            expect(inspection.field_mode).toBe(validQuickInspectionData.field_mode);
            expect(inspection.quick_score).toBeDefined();
            expect(inspection.status).toBeDefined();
        });
    });

    describe('Score Calculation Logic', () => {
        it('should calculate weighted scores correctly', async () => {
            // Test specific combinations to verify weight calculations
            const testData = {
                queen_present: 'yes',      // 25 * 100 = 2500
                queen_laying: 'yes',       // 25 * 100 = 2500  
                brood_pattern: 'good',     // 20 * 80 = 1600
                population_strength: 'moderate', // 15 * 60 = 900
                food_stores: 'adequate'    // 15 * 80 = 1200
            };
            // Total: 8700 / 100 = 87

            const response = await request(app)
                .post(`/api/inspections/hive/${hive.id}/quick`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(testData)
                .expect(201);

            expect(response.body.data.summary.score).toBe(87);
            expect(response.body.data.summary.status).toBe('green');
        });

        it('should handle unknown values correctly', async () => {
            const testData = {
                queen_present: 'unknown',
                queen_laying: 'unknown',
                brood_pattern: 'fair',
                population_strength: 'moderate',
                food_stores: 'adequate'
            };

            const response = await request(app)
                .post(`/api/inspections/hive/${hive.id}/quick`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(testData)
                .expect(201);

            // Should still calculate a reasonable score
            expect(response.body.data.summary.score).toBeGreaterThan(0);
            expect(response.body.data.summary.score).toBeLessThan(100);
        });
    });
});

// Helper function tests
describe('Quick Inspection Helper Functions', () => {
    describe('calculateQuickInspectionScore', () => {
        // These would test the helper function directly if exported
        // For now, we test through the API endpoints above
    });

    describe('generateQuickRecommendations', () => {
        // These would test the recommendation generation logic
        // For now, we test through the API endpoints above
    });

    describe('calculateNextInspectionDate', () => {
        // These would test the next inspection date calculation
        // For now, we test through the API endpoints above
    });
});