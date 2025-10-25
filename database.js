const { Sequelize } = require('sequelize');
const logger = require('../utils/logger');

// Database configuration
const sequelize = new Sequelize({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'beekeeping_app',
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ?
        (msg) => logger.debug(msg) : false,
    pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000
    },
    define: {
        timestamps: true,
        underscored: true,
        freezeTableName: true
    }
});

// Test connection function
async function testConnection() {
    try {
        await sequelize.authenticate();
        logger.info('Database connection has been established successfully');
        return true;
    } catch (error) {
        logger.error('Unable to connect to the database:', error);
        return false;
    }
}

module.exports = {
    sequelize,
    testConnection
};