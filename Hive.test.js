const { Hive, Apiary, User } = require('../../src/server/models');

describe('Hive Model', () => {
    let user, apiary;

    beforeEach(async () => {
        // Create test user
        user = await User.create({
            name: 'Test Beekeeper',
            email: 'test@example.com',
            password: 'hashedpassword123'
        });

        // Create test apiary
        apiary = await Apiary.create({
            name: 'Test Apiary',
            owner_id: user.id,
            location: {
                coordinates: {
                    latitude: 24.7136,
                    longitude: 46.6753
                },
                address: 'Riyadh, Saudi Arabia'
            }
        });
    });

    describe('Hive Creation', () => {
        test('should create a hive with valid data', async () => {
            const hiveData = {
                apiary_id: apiary.id,
                name: 'Hive-001',
                position: {
                    row: 1,
                    column: 1
                },
                type: 'أمريكي',
                specifications: {
                    frame_count: 10,
                    dimensions: {
                        length: 50,
                        width: 40,
                        height: 25
                    },
                    floor_count: 1,
                    frame_type: 'wooden'
                },
                colony: {
                    age: 6,
                    queen_age: 3,
                    source: 'purchase',
                    strength: 'medium'
                }
            };

            const hive = await Hive.create(hiveData);

            expect(hive.id).toBeDefined();
            expect(hive.name).toBe('Hive-001');
            expect(hive.type).toBe('أمريكي');
            expect(hive.status).toBe('active');
            expect(hive.colony.strength).toBe('medium');
        });

        test('should fail to create hive without required fields', async () => {
            const invalidHiveData = {
                apiary_id: apiary.id,
                name: 'Invalid Hive'
                // Missing required fields
            };

            await expect(Hive.create(invalidHiveData)).rejects.toThrow();
        });

        test('should prevent duplicate hive names in same apiary', async () => {
            const hiveData = {
                apiary_id: apiary.id,
                name: 'Duplicate-Hive',
                position: { row: 1, column: 1 },
                type: 'بلدي',
                specifications: {
                    frame_count: 8,
                    dimensions: { length: 40, width: 30, height: 20 }
                },
                colony: {
                    age: 12,
                    queen_age: 6,
                    source: 'division'
                }
            };

            // Create first hive
            await Hive.create(hiveData);

            // Try to create second hive with same name
            await expect(Hive.create(hiveData)).rejects.toThrow();
        });
    });

    describe('Health Score Calculation', () => {
        let hive;

        beforeEach(async () => {
            hive = await Hive.create({
                apiary_id: apiary.id,
                name: 'Test-Hive',
                position: { row: 1, column: 1 },
                type: 'أمريكي',
                specifications: {
                    frame_count: 10,
                    dimensions: { length: 50, width: 40, height: 25 }
                },
                colony: {
                    age: 6,
                    queen_age: 3,
                    source: 'purchase'
                }
            });
        });

        test('should calculate perfect health score', () => {
            const inspectionData = {
                queen_present: true,
                egg_pattern: 'regular',
                colony_strength: 'strong',
                brood_pattern: 'solid',
                food_stores: 'abundant',
                diseases: [],
                pests: []
            };

            const score = hive.calculateHealthScore(inspectionData);
            expect(score).toBe(40); // Perfect score
        });

        test('should calculate low health score for problematic hive', () => {
            const inspectionData = {
                queen_present: false,
                egg_pattern: 'none',
                colony_strength: 'weak',
                brood_pattern: 'scattered',
                food_stores: 'critical',
                diseases: ['varroa', 'nosema'],
                pests: ['wax_moth']
            };

            const score = hive.calculateHealthScore(inspectionData);
            expect(score).toBeLessThan(15);
        });

        test('should return correct health status based on score', () => {
            expect(hive.getHealthStatus(38)).toBe('excellent');
            expect(hive.getHealthStatus(28)).toBe('good');
            expect(hive.getHealthStatus(18)).toBe('warning');
            expect(hive.getHealthStatus(8)).toBe('critical');
        });
    });

    describe('Frame Management', () => {
        let hive;

        beforeEach(async () => {
            hive = await Hive.create({
                apiary_id: apiary.id,
                name: 'Frame-Test-Hive',
                position: { row: 1, column: 1 },
                type: 'أمريكي',
                specifications: {
                    frame_count: 10,
                    dimensions: { length: 50, width: 40, height: 25 }
                },
                colony: {
                    age: 6,
                    queen_age: 3,
                    source: 'purchase'
                },
                frames: {
                    waxed: 5,
                    empty: 2,
                    brood: 2,
                    honey: 1,
                    pollen: 0
                }
            });
        });

        test('should calculate total frames correctly', () => {
            const totalFrames = hive.getTotalFrames();
            expect(totalFrames).toBe(10); // 5+2+2+1+0
        });

        test('should calculate capacity utilization', () => {
            const utilization = hive.getCapacityUtilization();
            expect(utilization).toBe(100); // 10/10 * 100
        });

        test('should handle empty frames object', async () => {
            const emptyHive = await Hive.create({
                apiary_id: apiary.id,
                name: 'Empty-Hive',
                position: { row: 2, column: 1 },
                type: 'بلدي',
                specifications: {
                    frame_count: 8,
                    dimensions: { length: 40, width: 30, height: 20 }
                },
                colony: {
                    age: 1,
                    queen_age: 1,
                    source: 'swarm'
                }
            });

            expect(emptyHive.getTotalFrames()).toBe(0);
            expect(emptyHive.getCapacityUtilization()).toBe(0);
        });
    });

    describe('Associations', () => {
        test('should belong to apiary', async () => {
            const hive = await Hive.create({
                apiary_id: apiary.id,
                name: 'Association-Test',
                position: { row: 1, column: 1 },
                type: 'كيني',
                specifications: {
                    frame_count: 20,
                    dimensions: { length: 100, width: 30, height: 20 }
                },
                colony: {
                    age: 3,
                    queen_age: 2,
                    source: 'division'
                }
            });

            const hiveWithApiary = await Hive.findByPk(hive.id, {
                include: [{ model: Apiary, as: 'apiary' }]
            });

            expect(hiveWithApiary.apiary).toBeDefined();
            expect(hiveWithApiary.apiary.id).toBe(apiary.id);
            expect(hiveWithApiary.apiary.name).toBe('Test Apiary');
        });
    });
});