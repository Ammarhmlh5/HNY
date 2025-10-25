const request = require('supertest');
const app = require('../../src/server/app');
const { User, Hive, Apiary, Feeding } = require('../../src/server/models');
const FeedingService = require('../../src/server/services/FeedingService');
const jwt = require('jsonwebtoken');

describe('Feeding Service', () => {
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
        await Feeding.destroy({ where: {} });
        await Hive.destroy({ where: {} });
        await Apiary.destroy({ where: {} });
        await User.destroy({ where: {} });
    });

    describe('FeedingService.createFeeding', () => {
        it('should create a new feeding record successfully', async () => {
            const feedingData = {
                user_id: user.id,
                hive_id: hive.id,
                feeding_type: 'sugar_syrup',
                ingredients: { sugar: 1000, water: 1000 },
                total_cost: 5.0,
                feeding_method: 'top_feeder',
                status: 'planned'
            };

            const feeding = await FeedingService.createFeeding(feedingData);

            expect(feeding).toBeTruthy();
            expect(feeding.user_id).toBe(user.id);
            expect(feeding.hive_id).toBe(hive.id);
            expect(feeding.feeding_type).toBe('sugar_syrup');
            expect(feeding.total_cost).toBe(5.0);
            expect(feeding.status).toBe('planned');
        });

        it('should set default feeding date if not provided', async () => {
            const feedingData = {
                user_id: user.id,
                hive_id: hive.id,
                feeding_type: 'sugar_syrup',
                ingredients: { sugar: 1000, water: 1000 },
                total_cost: 5.0,
                feeding_method: 'top_feeder'
            };

            const feeding = await FeedingService.createFeeding(feedingData);

            expect(feeding.feeding_date).toBeTruthy();
            expect(new Date(feeding.feeding_date)).toBeInstanceOf(Date);
        });
    });

    describe('FeedingService.calculateFeedingAmounts', () => {
        const baseHiveData = {
            population_strength: 'moderate',
            food_stores: 'adequate',
            brood_pattern: 'good',
            hive_type: 'langstroth'
        };

        it('should calculate basic sugar syrup amounts', async () => {
            const calculation = FeedingService.calculateFeedingAmounts(
                baseHiveData,
                'sugar_syrup'
            );

            expect(calculation).toBeTruthy();
            expect(calculation.amounts).toBeTruthy();
            expect(calculation.amounts.sugar).toBeGreaterThan(0);
            expect(calculation.amounts.water).toBeGreaterThan(0);
            expect(calculation.total_cost).toBeGreaterThan(0);
            expect(calculation.feeding_type).toBe('sugar_syrup');
        });

        it('should adjust amounts based on population strength', async () => {
            const weakHive = { ...baseHiveData, population_strength: 'very_weak' };
            const strongHive = { ...baseHiveData, population_strength: 'very_strong' };

            const weakCalculation = FeedingService.calculateFeedingAmounts(weakHive, 'sugar_syrup');
            const strongCalculation = FeedingService.calculateFeedingAmounts(strongHive, 'sugar_syrup');

            expect(weakCalculation.amounts.sugar).toBeLessThan(strongCalculation.amounts.sugar);
            expect(weakCalculation.multipliers.population).toBeLessThan(strongCalculation.multipliers.population);
        });

        it('should adjust amounts based on food stores', async () => {
            const criticalHive = { ...baseHiveData, food_stores: 'critical' };
            const abundantHive = { ...baseHiveData, food_stores: 'abundant' };

            const criticalCalculation = FeedingService.calculateFeedingAmounts(criticalHive, 'sugar_syrup');
            const abundantCalculation = FeedingService.calculateFeedingAmounts(abundantHive, 'sugar_syrup');

            expect(criticalCalculation.amounts.sugar).toBeGreaterThan(abundantCalculation.amounts.sugar);
            expect(criticalCalculation.multipliers.food_stores).toBeGreaterThan(abundantCalculation.multipliers.food_stores);
        });

        it('should calculate different feeding types correctly', async () => {
            const sugarSyrup = FeedingService.calculateFeedingAmounts(baseHiveData, 'sugar_syrup');
            const pollenPatty = FeedingService.calculateFeedingAmounts(baseHiveData, 'pollen_patty');

            expect(sugarSyrup.amounts.sugar).toBeTruthy();
            expect(sugarSyrup.amounts.water).toBeTruthy();
            expect(pollenPatty.amounts.pollen).toBeTruthy();
            expect(pollenPatty.amounts.honey).toBeTruthy();
        });

        it('should include recommendations', async () => {
            const calculation = FeedingService.calculateFeedingAmounts(baseHiveData, 'sugar_syrup');

            expect(calculation.recommendations).toBeTruthy();
            expect(Array.isArray(calculation.recommendations)).toBe(true);
            expect(calculation.recommendations.length).toBeGreaterThan(0);
        });

        it('should adjust for seasonal variations', async () => {
            const springCalculation = FeedingService.calculateFeedingAmounts(baseHiveData, 'sugar_syrup', 'spring');
            const summerCalculation = FeedingService.calculateFeedingAmounts(baseHiveData, 'sugar_syrup', 'summer');

            expect(springCalculation.multipliers.seasonal).toBeGreaterThan(summerCalculation.multipliers.seasonal);
        });

        it('should adjust for weather conditions', async () => {
            const coldWeather = { temperature: 10, conditions: 'ممطر' };
            const normalWeather = { temperature: 25, conditions: 'صافي' };

            const coldCalculation = FeedingService.calculateFeedingAmounts(baseHiveData, 'sugar_syrup', null, coldWeather);
            const normalCalculation = FeedingService.calculateFeedingAmounts(baseHiveData, 'sugar_syrup', null, normalWeather);

            expect(coldCalculation.multipliers.weather).toBeGreaterThan(normalCalculation.multipliers.weather);
        });
    });

    describe('FeedingService.calculateBulkFeeding', () => {
        it('should calculate bulk feeding for multiple hives', async () => {
            const hivesData = [
                {
                    hive_id: 1,
                    hive_name: 'Hive 1',
                    population_strength: 'strong',
                    food_stores: 'adequate',
                    brood_pattern: 'good'
                },
                {
                    hive_id: 2,
                    hive_name: 'Hive 2',
                    population_strength: 'moderate',
                    food_stores: 'low',
                    brood_pattern: 'fair'
                }
            ];

            const bulkCalculation = FeedingService.calculateBulkFeeding(hivesData, 'sugar_syrup');

            expect(bulkCalculation).toBeTruthy();
            expect(bulkCalculation.hive_calculations).toHaveLength(2);
            expect(bulkCalculation.total_amounts).toBeTruthy();
            expect(bulkCalculation.total_cost).toBeGreaterThan(0);
            expect(bulkCalculation.shopping_list).toBeTruthy();
            expect(bulkCalculation.recommendations).toBeTruthy();
        });

        it('should sum up total amounts correctly', async () => {
            const hivesData = [
                {
                    hive_id: 1,
                    hive_name: 'Hive 1',
                    population_strength: 'moderate',
                    food_stores: 'adequate',
                    brood_pattern: 'good'
                },
                {
                    hive_id: 2,
                    hive_name: 'Hive 2',
                    population_strength: 'moderate',
                    food_stores: 'adequate',
                    brood_pattern: 'good'
                }
            ];

            const bulkCalculation = FeedingService.calculateBulkFeeding(hivesData, 'sugar_syrup');
            const singleCalculation = FeedingService.calculateFeedingAmounts(hivesData[0], 'sugar_syrup');

            // Total should be approximately double for two similar hives
            expect(bulkCalculation.total_amounts.sugar).toBeCloseTo(singleCalculation.amounts.sugar * 2, -2);
        });

        it('should generate shopping list with package sizes', async () => {
            const hivesData = [
                {
                    hive_id: 1,
                    hive_name: 'Hive 1',
                    population_strength: 'moderate',
                    food_stores: 'adequate',
                    brood_pattern: 'good'
                }
            ];

            const bulkCalculation = FeedingService.calculateBulkFeeding(hivesData, 'sugar_syrup');

            expect(bulkCalculation.shopping_list.sugar).toBeTruthy();
            expect(bulkCalculation.shopping_list.sugar.packages_needed).toBeGreaterThan(0);
            expect(bulkCalculation.shopping_list.sugar.total_cost).toBeGreaterThan(0);
        });
    });

    describe('FeedingService.getFeedingRecipes', () => {
        it('should return all available recipes', async () => {
            const recipes = FeedingService.getFeedingRecipes();

            expect(recipes).toBeTruthy();
            expect(typeof recipes).toBe('object');
            expect(Object.keys(recipes).length).toBeGreaterThan(0);
        });

        it('should include recipe details', async () => {
            const recipes = FeedingService.getFeedingRecipes();
            const sugarSyrup = recipes.sugar_syrup_1_1;

            expect(sugarSyrup).toBeTruthy();
            expect(sugarSyrup.name).toBeTruthy();
            expect(sugarSyrup.description).toBeTruthy();
            expect(sugarSyrup.ingredients).toBeTruthy();
            expect(sugarSyrup.instructions).toBeTruthy();
            expect(Array.isArray(sugarSyrup.instructions)).toBe(true);
            expect(sugarSyrup.cost_per_liter).toBeGreaterThan(0);
        });
    });

    describe('FeedingService.getFeedingSchedule', () => {
        const hiveData = {
            population_strength: 'moderate',
            food_stores: 'adequate',
            brood_pattern: 'good'
        };

        it('should generate feeding schedule', async () => {
            const schedule = FeedingService.getFeedingSchedule(hiveData, 'sugar_syrup', 14);

            expect(schedule).toBeTruthy();
            expect(Array.isArray(schedule)).toBe(true);
            expect(schedule.length).toBeGreaterThan(0);
        });

        it('should adjust frequency based on feeding type', async () => {
            const emergencySchedule = FeedingService.getFeedingSchedule(hiveData, 'emergency_feeding', 7);
            const maintenanceSchedule = FeedingService.getFeedingSchedule(hiveData, 'maintenance_feeding', 7);

            // Emergency feeding should be more frequent
            expect(emergencySchedule.length).toBeGreaterThan(maintenanceSchedule.length);
        });

        it('should adjust frequency based on hive condition', async () => {
            const criticalHive = { ...hiveData, food_stores: 'critical' };
            const adequateHive = { ...hiveData, food_stores: 'adequate' };

            const criticalSchedule = FeedingService.getFeedingSchedule(criticalHive, 'sugar_syrup', 14);
            const adequateSchedule = FeedingService.getFeedingSchedule(adequateHive, 'sugar_syrup', 14);

            // Critical hive should need more frequent feeding
            expect(criticalSchedule.length).toBeGreaterThanOrEqual(adequateSchedule.length);
        });
    });

    describe('FeedingService.getFeedingStats', () => {
        beforeEach(async () => {
            // Create test feeding records
            await FeedingService.createFeeding({
                user_id: user.id,
                hive_id: hive.id,
                feeding_type: 'sugar_syrup',
                ingredients: { sugar: 1000, water: 1000 },
                total_cost: 5.0,
                feeding_method: 'top_feeder',
                status: 'completed'
            });

            await FeedingService.createFeeding({
                user_id: user.id,
                hive_id: hive.id,
                feeding_type: 'pollen_patty',
                ingredients: { pollen: 200, sugar: 300 },
                total_cost: 15.0,
                feeding_method: 'patty_placement',
                status: 'completed'
            });
        });

        it('should return feeding statistics', async () => {
            const stats = await FeedingService.getFeedingStats(user.id);

            expect(stats).toBeTruthy();
            expect(stats.total_feedings).toBe(2);
            expect(stats.total_cost).toBe(20.0);
            expect(stats.by_type.sugar_syrup).toBeTruthy();
            expect(stats.by_type.pollen_patty).toBeTruthy();
        });

        it('should filter stats by hive', async () => {
            const stats = await FeedingService.getFeedingStats(user.id, { hive_id: hive.id });

            expect(stats.total_feedings).toBe(2);
        });

        it('should calculate average cost per feeding', async () => {
            const stats = await FeedingService.getFeedingStats(user.id);

            expect(stats.average_cost_per_feeding).toBe(10.0);
        });
    });
});

describe('API Endpoints', () => {
    let user, apiary, hive, authToken;

    beforeEach(async () => {
        user = await User.create({
            name: 'Test Beekeeper',
            email: 'test@example.com',
            password: 'password123',
            phone: '1234567890'
        });

        authToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'test-secret');

        apiary = await Apiary.create({
            name: 'Test Apiary',
            location: 'Test Location',
            user_id: user.id,
            latitude: 24.7136,
            longitude: 46.6753
        });

        hive = await Hive.create({
            name: 'Test Hive 1',
            apiary_id: apiary.id,
            user_id: user.id,
            hive_type: 'langstroth',
            status: 'active'
        });
    });

    afterEach(async () => {
        await Feeding.destroy({ where: {} });
        await Hive.destroy({ where: {} });
        await Apiary.destroy({ where: {} });
        await User.destroy({ where: {} });
    });

    describe('POST /api/feeding/calculate', () => {
        const validCalculationData = {
            hive_data: {
                population_strength: 'moderate',
                food_stores: 'adequate',
                brood_pattern: 'good',
                hive_type: 'langstroth'
            },
            feeding_type: 'sugar_syrup'
        };

        it('should calculate feeding amounts', async () => {
            const response = await request(app)
                .post('/api/feeding/calculate')
                .set('Authorization', `Bearer ${authToken}`)
                .send(validCalculationData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.amounts).toBeTruthy();
            expect(response.body.data.total_cost).toBeGreaterThan(0);
            expect(response.body.data.recommendations).toBeTruthy();
        });

        it('should require authentication', async () => {
            await request(app)
                .post('/api/feeding/calculate')
                .send(validCalculationData)
                .expect(401);
        });

        it('should validate input data', async () => {
            const invalidData = {
                hive_data: {},
                feeding_type: 'invalid_type'
            };

            const response = await request(app)
                .post('/api/feeding/calculate')
                .set('Authorization', `Bearer ${authToken}`)
                .send(invalidData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.errors).toBeTruthy();
        });
    });

    describe('POST /api/feeding/calculate-bulk', () => {
        const validBulkData = {
            hives_data: [
                {
                    hive_id: 1,
                    hive_name: 'Hive 1',
                    population_strength: 'moderate',
                    food_stores: 'adequate'
                },
                {
                    hive_id: 2,
                    hive_name: 'Hive 2',
                    population_strength: 'strong',
                    food_stores: 'low'
                }
            ],
            feeding_type: 'sugar_syrup'
        };

        it('should calculate bulk feeding', async () => {
            const response = await request(app)
                .post('/api/feeding/calculate-bulk')
                .set('Authorization', `Bearer ${authToken}`)
                .send(validBulkData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.hive_calculations).toHaveLength(2);
            expect(response.body.data.total_amounts).toBeTruthy();
            expect(response.body.data.shopping_list).toBeTruthy();
        });

        it('should validate hives data', async () => {
            const invalidData = {
                hives_data: [],
                feeding_type: 'sugar_syrup'
            };

            const response = await request(app)
                .post('/api/feeding/calculate-bulk')
                .set('Authorization', `Bearer ${authToken}`)
                .send(invalidData)
                .expect(400);

            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /api/feeding/recipes/list', () => {
        it('should return feeding recipes', async () => {
            const response = await request(app)
                .get('/api/feeding/recipes/list')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeTruthy();
            expect(typeof response.body.data).toBe('object');
        });

        it('should require authentication', async () => {
            await request(app)
                .get('/api/feeding/recipes/list')
                .expect(401);
        });
    });

    describe('POST /api/feeding', () => {
        const validFeedingData = {
            hive_id: null, // Will be set in test
            feeding_type: 'sugar_syrup',
            ingredients: { sugar: 1000, water: 1000 },
            total_cost: 5.0,
            feeding_method: 'top_feeder',
            status: 'planned'
        };

        it('should create feeding record', async () => {
            const feedingData = { ...validFeedingData, hive_id: hive.id };

            const response = await request(app)
                .post('/api/feeding')
                .set('Authorization', `Bearer ${authToken}`)
                .send(feedingData)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.data.hive_id).toBe(hive.id);
            expect(response.body.data.feeding_type).toBe('sugar_syrup');
        });

        it('should validate feeding data', async () => {
            const invalidData = {
                feeding_type: 'invalid_type',
                ingredients: 'not_an_object'
            };

            const response = await request(app)
                .post('/api/feeding')
                .set('Authorization', `Bearer ${authToken}`)
                .send(invalidData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.errors).toBeTruthy();
        });

        it('should verify hive ownership', async () => {
            const otherUser = await User.create({
                name: 'Other User',
                email: 'other@example.com',
                password: 'password123',
                phone: '0987654321'
            });

            const otherToken = jwt.sign({ userId: otherUser.id }, process.env.JWT_SECRET || 'test-secret');
            const feedingData = { ...validFeedingData, hive_id: hive.id };

            const response = await request(app)
                .post('/api/feeding')
                .set('Authorization', `Bearer ${otherToken}`)
                .send(feedingData)
                .expect(404);

            expect(response.body.success).toBe(false);

            await User.destroy({ where: { id: otherUser.id } });
        });
    });

    describe('GET /api/feeding/stats/summary', () => {
        beforeEach(async () => {
            await FeedingService.createFeeding({
                user_id: user.id,
                hive_id: hive.id,
                feeding_type: 'sugar_syrup',
                ingredients: { sugar: 1000, water: 1000 },
                total_cost: 5.0,
                feeding_method: 'top_feeder',
                status: 'completed'
            });
        });

        it('should return feeding statistics', async () => {
            const response = await request(app)
                .get('/api/feeding/stats/summary')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.total_feedings).toBe(1);
            expect(response.body.data.total_cost).toBe(5.0);
        });

        it('should filter by hive', async () => {
            const response = await request(app)
                .get(`/api/feeding/stats/summary?hive_id=${hive.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.total_feedings).toBe(1);
        });
    });
});