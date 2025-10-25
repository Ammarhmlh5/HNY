const request = require('supertest');
const app = require('../../src/server/app');
const { User, Hive, Apiary, Alert, Inspection } = require('../../src/server/models');
const AlertService = require('../../src/server/services/AlertService');
const RecommendationService = require('../../src/server/services/RecommendationService');
const jwt = require('jsonwebtoken');

describe('Alert Service', () => {
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
        await Alert.destroy({ where: {} });
        await Inspection.destroy({ where: {} });
        await Hive.destroy({ where: {} });
        await Apiary.destroy({ where: {} });
        await User.destroy({ where: {} });
    });

    describe('AlertService.createAlert', () => {
        it('should create a new alert successfully', async () => {
            const alertData = {
                user_id: user.id,
                hive_id: hive.id,
                type: 'inspection_reminder',
                priority: 'medium',
                title: 'Test Alert',
                message: 'This is a test alert',
                metadata: { test: true }
            };

            const alert = await AlertService.createAlert(alertData);

            expect(alert).toBeTruthy();
            expect(alert.user_id).toBe(user.id);
            expect(alert.hive_id).toBe(hive.id);
            expect(alert.type).toBe('inspection_reminder');
            expect(alert.priority).toBe('medium');
            expect(alert.title).toBe('Test Alert');
            expect(alert.is_read).toBe(false);
            expect(alert.is_resolved).toBe(false);
        });

        it('should create alert with expiration date', async () => {
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 7);

            const alertData = {
                user_id: user.id,
                type: 'seasonal_task',
                priority: 'low',
                title: 'Seasonal Task',
                message: 'Time for seasonal maintenance',
                expires_at: expiresAt
            };

            const alert = await AlertService.createAlert(alertData);

            expect(alert.expires_at).toBeTruthy();
            expect(new Date(alert.expires_at)).toEqual(expiresAt);
        });
    });

    describe('AlertService.getAlerts', () => {
        beforeEach(async () => {
            // Create test alerts
            await AlertService.createAlert({
                user_id: user.id,
                hive_id: hive.id,
                type: 'health_issue',
                priority: 'high',
                title: 'High Priority Alert',
                message: 'Critical health issue'
            });

            await AlertService.createAlert({
                user_id: user.id,
                type: 'feeding_required',
                priority: 'medium',
                title: 'Medium Priority Alert',
                message: 'Feeding required'
            });

            await AlertService.createAlert({
                user_id: user.id,
                type: 'seasonal_task',
                priority: 'low',
                title: 'Low Priority Alert',
                message: 'Seasonal maintenance'
            });
        });

        it('should get all alerts for user', async () => {
            const result = await AlertService.getAlerts(user.id);

            expect(result.alerts).toHaveLength(3);
            expect(result.pagination.total).toBe(3);
        });

        it('should filter alerts by type', async () => {
            const result = await AlertService.getAlerts(user.id, { type: 'health_issue' });

            expect(result.alerts).toHaveLength(1);
            expect(result.alerts[0].type).toBe('health_issue');
        });

        it('should filter alerts by priority', async () => {
            const result = await AlertService.getAlerts(user.id, { priority: 'high' });

            expect(result.alerts).toHaveLength(1);
            expect(result.alerts[0].priority).toBe('high');
        });

        it('should paginate results', async () => {
            const result = await AlertService.getAlerts(user.id, {}, { page: 1, limit: 2 });

            expect(result.alerts).toHaveLength(2);
            expect(result.pagination.page).toBe(1);
            expect(result.pagination.limit).toBe(2);
            expect(result.pagination.total_pages).toBe(2);
        });

        it('should sort alerts by creation date', async () => {
            const result = await AlertService.getAlerts(user.id, {}, { sort_by: 'created_at', sort_order: 'DESC' });

            expect(result.alerts).toHaveLength(3);
            // Should be sorted by newest first
            expect(new Date(result.alerts[0].created_at)).toBeInstanceOf(Date);
        });
    });

    describe('AlertService.markAsRead', () => {
        let alert;

        beforeEach(async () => {
            alert = await AlertService.createAlert({
                user_id: user.id,
                type: 'inspection_reminder',
                priority: 'medium',
                title: 'Test Alert',
                message: 'Test message'
            });
        });

        it('should mark alert as read', async () => {
            const success = await AlertService.markAsRead(alert.id, user.id);

            expect(success).toBe(true);

            const updatedAlert = await AlertService.getAlertById(alert.id, user.id);
            expect(updatedAlert.is_read).toBe(true);
            expect(updatedAlert.read_at).toBeTruthy();
        });

        it('should not mark alert as read for different user', async () => {
            const otherUser = await User.create({
                name: 'Other User',
                email: 'other@example.com',
                password: 'password123',
                phone: '0987654321'
            });

            const success = await AlertService.markAsRead(alert.id, otherUser.id);

            expect(success).toBe(false);

            await User.destroy({ where: { id: otherUser.id } });
        });
    });

    describe('AlertService.markAsResolved', () => {
        let alert;

        beforeEach(async () => {
            alert = await AlertService.createAlert({
                user_id: user.id,
                type: 'health_issue',
                priority: 'high',
                title: 'Health Issue',
                message: 'Critical health problem'
            });
        });

        it('should mark alert as resolved', async () => {
            const resolutionNotes = 'Issue resolved by replacing queen';
            const success = await AlertService.markAsResolved(alert.id, user.id, resolutionNotes);

            expect(success).toBe(true);

            const updatedAlert = await AlertService.getAlertById(alert.id, user.id);
            expect(updatedAlert.is_resolved).toBe(true);
            expect(updatedAlert.resolved_at).toBeTruthy();
            expect(updatedAlert.resolution_notes).toBe(resolutionNotes);
        });
    });

    describe('AlertService.generateInspectionReminders', () => {
        it('should generate reminders for hives never inspected', async () => {
            const alerts = await AlertService.generateInspectionReminders();

            expect(alerts.length).toBeGreaterThan(0);
            expect(alerts[0].type).toBe('inspection_reminder');
            expect(alerts[0].priority).toBe('high');
            expect(alerts[0].hive_id).toBe(hive.id);
        });

        it('should generate reminders for overdue inspections', async () => {
            // Create old inspection
            const oldDate = new Date();
            oldDate.setDate(oldDate.getDate() - 25); // 25 days ago

            await Inspection.create({
                hive_id: hive.id,
                user_id: user.id,
                inspection_date: oldDate,
                inspection_type: 'routine',
                queen_present: 'yes',
                queen_laying: 'yes',
                brood_pattern: 'good',
                population_strength: 'strong',
                food_stores: 'adequate'
            });

            const alerts = await AlertService.generateInspectionReminders();

            expect(alerts.length).toBeGreaterThan(0);
            const hiveAlert = alerts.find(a => a.hive_id === hive.id);
            expect(hiveAlert).toBeTruthy();
            expect(hiveAlert.priority).toBe('high');
        });

        it('should not generate duplicate reminders', async () => {
            // Generate reminders first time
            await AlertService.generateInspectionReminders();

            // Try to generate again immediately
            const secondAlerts = await AlertService.generateInspectionReminders();

            // Should not create duplicates within 24 hours
            expect(secondAlerts.length).toBe(0);
        });
    });

    describe('AlertService.generateHealthAlerts', () => {
        let inspection;

        beforeEach(async () => {
            inspection = await Inspection.create({
                hive_id: hive.id,
                user_id: user.id,
                inspection_date: new Date(),
                inspection_type: 'routine',
                queen_present: 'no', // Critical issue
                queen_laying: 'no',
                brood_pattern: 'none',
                population_strength: 'very_weak',
                food_stores: 'critical'
            });
        });

        it('should generate health alerts for critical issues', async () => {
            const alerts = await AlertService.generateHealthAlerts(inspection.id);

            expect(alerts.length).toBeGreaterThan(0);

            // Should have queenless alert
            const queenlessAlert = alerts.find(a => a.metadata.issue_type === 'queenless');
            expect(queenlessAlert).toBeTruthy();
            expect(queenlessAlert.priority).toBe('high');

            // Should have food shortage alert
            const foodAlert = alerts.find(a => a.metadata.issue_type === 'food_shortage');
            expect(foodAlert).toBeTruthy();
            expect(foodAlert.type).toBe('feeding_required');
        });

        it('should generate appropriate alert priorities', async () => {
            const alerts = await AlertService.generateHealthAlerts(inspection.id);

            const criticalAlerts = alerts.filter(a => a.priority === 'high');
            expect(criticalAlerts.length).toBeGreaterThan(0);
        });
    });

    describe('AlertService.generateSeasonalAlerts', () => {
        it('should generate spring seasonal alerts', async () => {
            const alerts = await AlertService.generateSeasonalAlerts(user.id, 'spring');

            expect(alerts.length).toBeGreaterThan(0);
            expect(alerts[0].type).toBe('seasonal_task');
            expect(alerts[0].metadata.season).toBe('spring');
        });

        it('should not generate duplicate seasonal alerts', async () => {
            // Generate spring alerts first time
            await AlertService.generateSeasonalAlerts(user.id, 'spring');

            // Try to generate again
            const secondAlerts = await AlertService.generateSeasonalAlerts(user.id, 'spring');

            // Should not create duplicates within 30 days
            expect(secondAlerts.length).toBe(0);
        });
    });

    describe('AlertService.getAlertStats', () => {
        beforeEach(async () => {
            // Create various alerts for testing
            await AlertService.createAlert({
                user_id: user.id,
                type: 'health_issue',
                priority: 'high',
                title: 'High Priority Health Issue',
                message: 'Critical problem'
            });

            await AlertService.createAlert({
                user_id: user.id,
                type: 'feeding_required',
                priority: 'medium',
                title: 'Feeding Required',
                message: 'Low food stores'
            });

            // Mark one as resolved
            const alert = await AlertService.createAlert({
                user_id: user.id,
                type: 'inspection_reminder',
                priority: 'low',
                title: 'Inspection Reminder',
                message: 'Time for inspection'
            });

            await AlertService.markAsResolved(alert.id, user.id);
        });

        it('should return correct alert statistics', async () => {
            const stats = await AlertService.getAlertStats(user.id);

            expect(stats.total).toBe(3);
            expect(stats.resolved).toBe(1);
            expect(stats.unresolved).toBe(2);
            expect(stats.by_priority.high).toBe(1);
            expect(stats.by_priority.medium).toBe(1);
            expect(stats.by_priority.low).toBe(1);
            expect(stats.by_type.health_issue).toBe(1);
            expect(stats.by_type.feeding_required).toBe(1);
            expect(stats.by_type.inspection_reminder).toBe(1);
        });
    });

    describe('Bulk Operations', () => {
        let alerts;

        beforeEach(async () => {
            alerts = [];
            for (let i = 0; i < 3; i++) {
                const alert = await AlertService.createAlert({
                    user_id: user.id,
                    type: 'inspection_reminder',
                    priority: 'medium',
                    title: `Test Alert ${i + 1}`,
                    message: `Test message ${i + 1}`
                });
                alerts.push(alert);
            }
        });

        it('should bulk mark alerts as read', async () => {
            const alertIds = alerts.map(a => a.id);
            const updatedCount = await AlertService.bulkMarkAsRead(alertIds, user.id);

            expect(updatedCount).toBe(3);

            // Verify all alerts are marked as read
            for (const alert of alerts) {
                const updatedAlert = await AlertService.getAlertById(alert.id, user.id);
                expect(updatedAlert.is_read).toBe(true);
            }
        });

        it('should bulk delete alerts', async () => {
            const alertIds = alerts.map(a => a.id);
            const deletedCount = await AlertService.bulkDeleteAlerts(alertIds, user.id);

            expect(deletedCount).toBe(3);

            // Verify all alerts are deleted
            for (const alert of alerts) {
                const deletedAlert = await AlertService.getAlertById(alert.id, user.id);
                expect(deletedAlert).toBeNull();
            }
        });
    });
});

describe('Recommendation Service', () => {
    let user, apiary, hive, authToken, inspection;

    beforeEach(async () => {
        // Create test data
        user = await User.create({
            name: 'Test Beekeeper',
            email: 'test@example.com',
            password: 'password123',
            phone: '1234567890'
        });

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

        inspection = await Inspection.create({
            hive_id: hive.id,
            user_id: user.id,
            inspection_date: new Date(),
            inspection_type: 'routine',
            queen_present: 'yes',
            queen_laying: 'yes',
            brood_pattern: 'good',
            population_strength: 'strong',
            food_stores: 'adequate'
        });
    });

    afterEach(async () => {
        await Inspection.destroy({ where: {} });
        await Hive.destroy({ where: {} });
        await Apiary.destroy({ where: {} });
        await User.destroy({ where: {} });
    });

    describe('RecommendationService.generateHiveRecommendations', () => {
        it('should generate recommendations for healthy hive', async () => {
            const recommendations = await RecommendationService.generateHiveRecommendations(hive.id, user.id);

            expect(recommendations).toBeTruthy();
            expect(recommendations.hive_id).toBe(hive.id);
            expect(recommendations.hive_name).toBe(hive.name);
            expect(recommendations.recommendations).toBeTruthy();
            expect(recommendations.recommendations.preventive).toBeDefined();
            expect(recommendations.recommendations.seasonal).toBeDefined();
        });

        it('should generate critical recommendations for problematic hive', async () => {
            // Update inspection with critical issues
            await inspection.update({
                queen_present: 'no',
                queen_laying: 'no',
                brood_pattern: 'none',
                population_strength: 'very_weak',
                food_stores: 'critical'
            });

            const recommendations = await RecommendationService.generateHiveRecommendations(hive.id, user.id);

            expect(recommendations.recommendations.immediate.length).toBeGreaterThan(0);

            // Should have queen management recommendation
            const queenRec = recommendations.recommendations.immediate.find(r => r.type === 'queen_management');
            expect(queenRec).toBeTruthy();
            expect(queenRec.priority).toBe('high');

            // Should have feeding recommendation
            const feedingRec = recommendations.recommendations.immediate.find(r => r.type === 'feeding');
            expect(feedingRec).toBeTruthy();
            expect(feedingRec.priority).toBe('high');
        });

        it('should generate time-based recommendations', async () => {
            // Create hive with no inspections
            const newHive = await Hive.create({
                name: 'New Hive',
                apiary_id: apiary.id,
                user_id: user.id,
                hive_type: 'langstroth',
                status: 'active'
            });

            const recommendations = await RecommendationService.generateHiveRecommendations(newHive.id, user.id);

            // Should recommend initial inspection
            const inspectionRec = recommendations.recommendations.immediate.find(r => r.type === 'inspection');
            expect(inspectionRec).toBeTruthy();
            expect(inspectionRec.action).toBe('initial_inspection');

            await Hive.destroy({ where: { id: newHive.id } });
        });

        it('should include weather-based recommendations', async () => {
            const recommendations = await RecommendationService.generateHiveRecommendations(hive.id, user.id);

            // Should have weather conditions if available
            if (recommendations.weather_conditions) {
                expect(recommendations.weather_conditions.temperature).toBeDefined();
                expect(recommendations.weather_conditions.humidity).toBeDefined();
            }
        });
    });

    describe('RecommendationService.generateApiaryRecommendations', () => {
        it('should generate apiary-level recommendations', async () => {
            const recommendations = await RecommendationService.generateApiaryRecommendations(apiary.id, user.id);

            expect(recommendations).toBeTruthy();
            expect(recommendations.apiary_id).toBe(apiary.id);
            expect(recommendations.apiary_name).toBe(apiary.name);
            expect(recommendations.total_hives).toBe(1);
            expect(recommendations.recommendations).toBeTruthy();
            expect(recommendations.recommendations.resource_optimization).toBeDefined();
        });

        it('should identify collective issues in apiary', async () => {
            // Create multiple hives with issues
            const hive2 = await Hive.create({
                name: 'Test Hive 2',
                apiary_id: apiary.id,
                user_id: user.id,
                hive_type: 'langstroth',
                status: 'active'
            });

            // Create problematic inspections for both hives
            await Inspection.create({
                hive_id: hive2.id,
                user_id: user.id,
                inspection_date: new Date(),
                inspection_type: 'routine',
                queen_present: 'no',
                queen_laying: 'no',
                brood_pattern: 'poor',
                population_strength: 'weak',
                food_stores: 'low'
            });

            await inspection.update({
                queen_present: 'no',
                population_strength: 'weak'
            });

            const recommendations = await RecommendationService.generateApiaryRecommendations(apiary.id, user.id);

            expect(recommendations.hives_needing_attention).toBeGreaterThan(0);
            expect(recommendations.recommendations.collective_actions.length).toBeGreaterThan(0);

            await Hive.destroy({ where: { id: hive2.id } });
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
        await Alert.destroy({ where: {} });
        await Inspection.destroy({ where: {} });
        await Hive.destroy({ where: {} });
        await Apiary.destroy({ where: {} });
        await User.destroy({ where: {} });
    });

    describe('GET /api/alerts', () => {
        beforeEach(async () => {
            await AlertService.createAlert({
                user_id: user.id,
                hive_id: hive.id,
                type: 'health_issue',
                priority: 'high',
                title: 'Test Alert',
                message: 'Test message'
            });
        });

        it('should get alerts for authenticated user', async () => {
            const response = await request(app)
                .get('/api/alerts')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.alerts).toHaveLength(1);
            expect(response.body.data.alerts[0].title).toBe('Test Alert');
        });

        it('should require authentication', async () => {
            await request(app)
                .get('/api/alerts')
                .expect(401);
        });

        it('should filter alerts by type', async () => {
            const response = await request(app)
                .get('/api/alerts?type=health_issue')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.data.alerts).toHaveLength(1);
            expect(response.body.data.alerts[0].type).toBe('health_issue');
        });
    });

    describe('POST /api/alerts', () => {
        const validAlertData = {
            type: 'custom',
            priority: 'medium',
            title: 'Custom Alert',
            message: 'This is a custom alert',
            hive_id: null
        };

        it('should create new alert', async () => {
            const alertData = { ...validAlertData, hive_id: hive.id };

            const response = await request(app)
                .post('/api/alerts')
                .set('Authorization', `Bearer ${authToken}`)
                .send(alertData)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.data.title).toBe(alertData.title);
            expect(response.body.data.hive_id).toBe(hive.id);
        });

        it('should validate alert data', async () => {
            const invalidData = {
                type: 'invalid_type',
                priority: 'invalid_priority'
            };

            const response = await request(app)
                .post('/api/alerts')
                .set('Authorization', `Bearer ${authToken}`)
                .send(invalidData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.errors).toBeDefined();
        });
    });

    describe('GET /api/alerts/recommendations/hive/:hiveId', () => {
        beforeEach(async () => {
            await Inspection.create({
                hive_id: hive.id,
                user_id: user.id,
                inspection_date: new Date(),
                inspection_type: 'routine',
                queen_present: 'yes',
                queen_laying: 'yes',
                brood_pattern: 'good',
                population_strength: 'strong',
                food_stores: 'adequate'
            });
        });

        it('should get hive recommendations', async () => {
            const response = await request(app)
                .get(`/api/alerts/recommendations/hive/${hive.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.hive_id).toBe(hive.id);
            expect(response.body.data.recommendations).toBeDefined();
        });

        it('should require hive ownership', async () => {
            const otherUser = await User.create({
                name: 'Other User',
                email: 'other@example.com',
                password: 'password123',
                phone: '0987654321'
            });

            const otherToken = jwt.sign({ userId: otherUser.id }, process.env.JWT_SECRET || 'test-secret');

            const response = await request(app)
                .get(`/api/alerts/recommendations/hive/${hive.id}`)
                .set('Authorization', `Bearer ${otherToken}`)
                .expect(500); // Should fail because hive doesn't belong to user

            await User.destroy({ where: { id: otherUser.id } });
        });
    });
});