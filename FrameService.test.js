const { describe, it, expect, beforeEach, afterEach } = require('@jest/globals');
const FrameService = require('../../src/server/services/FrameService');
const { Frame, Hive, Super, Apiary, User } = require('../../src/server/models');
const { AppError } = require('../../src/server/middleware/errorHandler');

describe('FrameService', () => {
    let frameService;
    let testUser;
    let testApiary;
    let testHive;
    let testSuper;

    beforeEach(async () => {
        frameService = new FrameService();

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

        // Create test super
        testSuper = await Super.create({
            hive_id: testHive.id,
            type: 'medium',
            frame_count: 8,
            position: 1,
            purpose: 'honey'
        });
    });

    afterEach(async () => {
        // Clean up test data
        await Frame.destroy({ where: {} });
        await Super.destroy({ where: {} });
        await Hive.destroy({ where: {} });
        await Apiary.destroy({ where: {} });
        await User.destroy({ where: {} });
    });

    describe('createFramesForHive', () => {
        it('should create frames for hive successfully', async () => {
            const frames = await frameService.createFramesForHive(testHive.id, testUser.id);

            expect(frames).toHaveLength(10);
            expect(frames[0].hive_id).toBe(testHive.id);
            expect(frames[0].super_id).toBeNull();
            expect(frames[0].position).toBe(1);
            expect(frames[0].type).toBe('foundation');
            expect(frames[0].comb_condition).toBe('new');
        });

        it('should create frames with custom options', async () => {
            const options = {
                foundation_type: 'plastic',
                initial_type: 'empty'
            };

            const frames = await frameService.createFramesForHive(testHive.id, testUser.id, options);

            expect(frames[0].foundation_type).toBe('plastic');
            expect(frames[0].type).toBe('empty');
        });

        it('should throw error for non-existent hive', async () => {
            const fakeHiveId = '123e4567-e89b-12d3-a456-426614174000';

            await expect(
                frameService.createFramesForHive(fakeHiveId, testUser.id)
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
                frameService.createFramesForHive(testHive.id, otherUser.id)
            ).rejects.toThrow(AppError);

            await otherUser.destroy();
        });
    });

    describe('createFramesForSuper', () => {
        it('should create frames for super successfully', async () => {
            const frames = await frameService.createFramesForSuper(testSuper.id, testUser.id);

            expect(frames).toHaveLength(8);
            expect(frames[0].hive_id).toBe(testHive.id);
            expect(frames[0].super_id).toBe(testSuper.id);
            expect(frames[0].position).toBe(1);
            expect(frames[0].type).toBe('foundation');
        });

        it('should throw error for non-existent super', async () => {
            const fakeSuperId = '123e4567-e89b-12d3-a456-426614174000';

            await expect(
                frameService.createFramesForSuper(fakeSuperId, testUser.id)
            ).rejects.toThrow(AppError);
        });
    });

    describe('updateFrameContent', () => {
        let testFrame;

        beforeEach(async () => {
            testFrame = await Frame.create({
                hive_id: testHive.id,
                position: 1,
                type: 'foundation',
                foundation_type: 'wired',
                comb_condition: 'new',
                comb_age: 0,
                content_details: {
                    brood_percentage: 0,
                    honey_percentage: 0,
                    pollen_percentage: 0,
                    empty_percentage: 100
                }
            });
        });

        it('should update frame content successfully', async () => {
            const inspectionData = {
                brood_percentage: 60,
                honey_percentage: 30,
                pollen_percentage: 10,
                brood_details: {
                    eggs: 'many',
                    larvae: 'some',
                    pupae: 'few'
                }
            };

            const updatedFrame = await frameService.updateFrameContent(
                testFrame.id,
                testUser.id,
                inspectionData
            );

            expect(updatedFrame.content_details.brood_percentage).toBe(60);
            expect(updatedFrame.content_details.honey_percentage).toBe(30);
            expect(updatedFrame.content_details.pollen_percentage).toBe(10);
            expect(updatedFrame.content_details.empty_percentage).toBe(0);
            expect(updatedFrame.type).toBe('brood');
            expect(updatedFrame.brood_details.eggs).toBe('many');
        });

        it('should update frame type based on dominant content', async () => {
            const inspectionData = {
                brood_percentage: 20,
                honey_percentage: 70,
                pollen_percentage: 10
            };

            const updatedFrame = await frameService.updateFrameContent(
                testFrame.id,
                testUser.id,
                inspectionData
            );

            expect(updatedFrame.type).toBe('honey');
        });

        it('should estimate honey weight automatically', async () => {
            const inspectionData = {
                honey_percentage: 80
            };

            const updatedFrame = await frameService.updateFrameContent(
                testFrame.id,
                testUser.id,
                inspectionData
            );

            expect(updatedFrame.estimated_weight).toBeGreaterThan(0);
        });
    });

    describe('getHiveFrameAnalysis', () => {
        beforeEach(async () => {
            // Create test frames with different conditions
            await Frame.bulkCreate([
                {
                    hive_id: testHive.id,
                    position: 1,
                    type: 'brood',
                    comb_condition: 'good',
                    comb_age: 12,
                    content_details: { brood_percentage: 80, honey_percentage: 20, pollen_percentage: 0, empty_percentage: 0 },
                    quality_score: 8
                },
                {
                    hive_id: testHive.id,
                    position: 2,
                    type: 'honey',
                    comb_condition: 'fair',
                    comb_age: 24,
                    content_details: { brood_percentage: 0, honey_percentage: 90, pollen_percentage: 0, empty_percentage: 10 },
                    quality_score: 6,
                    estimated_weight: 2.5
                },
                {
                    hive_id: testHive.id,
                    position: 3,
                    type: 'foundation',
                    comb_condition: 'new',
                    comb_age: 0,
                    content_details: { brood_percentage: 0, honey_percentage: 0, pollen_percentage: 0, empty_percentage: 100 },
                    quality_score: 10
                }
            ]);
        });

        it('should provide comprehensive hive analysis', async () => {
            const analysis = await frameService.getHiveFrameAnalysis(testHive.id, testUser.id);

            expect(analysis.total_frames).toBe(3);
            expect(analysis.type_distribution.brood).toBe(1);
            expect(analysis.type_distribution.honey).toBe(1);
            expect(analysis.type_distribution.foundation).toBe(1);
            expect(analysis.condition_distribution.good).toBe(1);
            expect(analysis.condition_distribution.fair).toBe(1);
            expect(analysis.condition_distribution.new).toBe(1);
            expect(analysis.average_quality_score).toBe(8.0);
            expect(analysis.total_estimated_honey).toBe(2.5);
            expect(analysis.productive_frames).toBe(2);
        });

        it('should include frames by super breakdown', async () => {
            const analysis = await frameService.getHiveFrameAnalysis(testHive.id, testUser.id);

            expect(analysis.frames_by_super.brood_chamber).toBeDefined();
            expect(analysis.frames_by_super.brood_chamber.total_frames).toBe(3);
        });
    });

    describe('getFrameRecommendations', () => {
        beforeEach(async () => {
            // Create frames with various conditions needing attention
            await Frame.bulkCreate([
                {
                    hive_id: testHive.id,
                    position: 1,
                    type: 'brood',
                    comb_condition: 'needs_replacement',
                    comb_age: 48,
                    content_details: { brood_percentage: 60, honey_percentage: 0, pollen_percentage: 0, empty_percentage: 40 },
                    needs_attention: true,
                    quality_score: 2
                },
                {
                    hive_id: testHive.id,
                    position: 2,
                    type: 'honey',
                    comb_condition: 'good',
                    comb_age: 6,
                    content_details: { brood_percentage: 0, honey_percentage: 85, pollen_percentage: 0, empty_percentage: 15 },
                    quality_score: 8,
                    estimated_weight: 2.2
                }
            ]);
        });

        it('should provide relevant recommendations', async () => {
            const recommendations = await frameService.getFrameRecommendations(testHive.id, testUser.id);

            expect(recommendations.recommendations).toHaveLength(2);

            // Should recommend urgent replacement
            const urgentRec = recommendations.recommendations.find(r => r.type === 'urgent');
            expect(urgentRec).toBeDefined();
            expect(urgentRec.priority).toBe('high');

            // Should recommend honey harvest
            const harvestRec = recommendations.recommendations.find(r => r.type === 'harvest');
            expect(harvestRec).toBeDefined();
            expect(harvestRec.estimated_honey).toBe(2.2);
        });

        it('should sort recommendations by priority', async () => {
            const recommendations = await frameService.getFrameRecommendations(testHive.id, testUser.id);

            // High priority should come first
            expect(recommendations.recommendations[0].priority).toBe('high');
        });
    });

    describe('scheduleFrameReplacement', () => {
        let testFrame;

        beforeEach(async () => {
            testFrame = await Frame.create({
                hive_id: testHive.id,
                position: 1,
                type: 'brood',
                comb_condition: 'poor',
                comb_age: 30
            });
        });

        it('should schedule frame replacement successfully', async () => {
            const updatedFrame = await frameService.scheduleFrameReplacement(
                testFrame.id,
                testUser.id,
                'poor_condition'
            );

            expect(updatedFrame.replacement_scheduled).toBeDefined();
            expect(updatedFrame.notes).toContain('Replacement scheduled');
        });
    });

    describe('replaceFrame', () => {
        let testFrame;

        beforeEach(async () => {
            testFrame = await Frame.create({
                hive_id: testHive.id,
                position: 1,
                type: 'brood',
                comb_condition: 'needs_replacement',
                comb_age: 48
            });
        });

        it('should replace frame successfully', async () => {
            const newFrameData = {
                foundation_type: 'plastic',
                reason: 'old_comb'
            };

            const newFrame = await frameService.replaceFrame(
                testFrame.id,
                testUser.id,
                newFrameData
            );

            expect(newFrame.id).not.toBe(testFrame.id);
            expect(newFrame.position).toBe(testFrame.position);
            expect(newFrame.hive_id).toBe(testFrame.hive_id);
            expect(newFrame.foundation_type).toBe('plastic');
            expect(newFrame.comb_condition).toBe('new');
            expect(newFrame.comb_age).toBe(0);
            expect(newFrame.notes).toContain('Replaced frame');
        });
    });

    describe('moveFrame', () => {
        let testFrame;

        beforeEach(async () => {
            testFrame = await Frame.create({
                hive_id: testHive.id,
                position: 1,
                type: 'brood',
                comb_condition: 'good'
            });
        });

        it('should move frame to new position successfully', async () => {
            const movedFrame = await frameService.moveFrame(
                testFrame.id,
                testUser.id,
                5
            );

            expect(movedFrame.position).toBe(5);
            expect(movedFrame.notes).toContain('Moved from position 1');
        });

        it('should move frame to different super', async () => {
            const movedFrame = await frameService.moveFrame(
                testFrame.id,
                testUser.id,
                3,
                testSuper.id
            );

            expect(movedFrame.position).toBe(3);
            expect(movedFrame.super_id).toBe(testSuper.id);
        });

        it('should throw error if position is occupied', async () => {
            // Create another frame at position 5
            await Frame.create({
                hive_id: testHive.id,
                position: 5,
                type: 'foundation',
                comb_condition: 'new'
            });

            await expect(
                frameService.moveFrame(testFrame.id, testUser.id, 5)
            ).rejects.toThrow(AppError);
        });
    });

    describe('bulkUpdateFrames', () => {
        let testFrames;

        beforeEach(async () => {
            testFrames = await Frame.bulkCreate([
                {
                    hive_id: testHive.id,
                    position: 1,
                    type: 'foundation',
                    comb_condition: 'new'
                },
                {
                    hive_id: testHive.id,
                    position: 2,
                    type: 'foundation',
                    comb_condition: 'new'
                }
            ]);
        });

        it('should update multiple frames successfully', async () => {
            const updates = [
                {
                    frame_id: testFrames[0].id,
                    content_details: {
                        brood_percentage: 70,
                        honey_percentage: 30,
                        pollen_percentage: 0
                    },
                    comb_condition: 'good'
                },
                {
                    frame_id: testFrames[1].id,
                    content_details: {
                        honey_percentage: 90,
                        brood_percentage: 0,
                        pollen_percentage: 10
                    },
                    comb_condition: 'fair'
                }
            ];

            const updatedFrames = await frameService.bulkUpdateFrames(
                testHive.id,
                testUser.id,
                updates
            );

            expect(updatedFrames).toHaveLength(2);
            expect(updatedFrames[0].type).toBe('brood');
            expect(updatedFrames[1].type).toBe('honey');
            expect(updatedFrames[0].comb_condition).toBe('good');
            expect(updatedFrames[1].comb_condition).toBe('fair');
        });
    });
});