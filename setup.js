// Test setup file
const { sequelize } = require('../src/server/config/database');

// Setup test database
beforeAll(async () => {
    // Set test environment
    process.env.NODE_ENV = 'test';
    process.env.DB_NAME = 'beekeeping_app_test';

    try {
        // Test database connection
        await sequelize.authenticate();
        console.log('Test database connection established');

        // Sync database models for testing
        await sequelize.sync({ force: true });
        console.log('Test database synchronized');
    } catch (error) {
        console.error('Unable to connect to test database:', error);
        process.exit(1);
    }
});

// Cleanup after all tests
afterAll(async () => {
    try {
        // Close database connection
        await sequelize.close();
        console.log('Test database connection closed');
    } catch (error) {
        console.error('Error closing test database:', error);
    }
});

// Clean up after each test
afterEach(async () => {
    // Clear all tables but keep structure
    const models = Object.keys(sequelize.models);

    for (const modelName of models) {
        await sequelize.models[modelName].destroy({
            where: {},
            force: true,
            cascade: true
        });
    }
});