const express = require('express');
const apiariesRouter = require('./apiaries');
const hivesRouter = require('./hives');
const supersRouter = require('./supers');
const framesRouter = require('./frames');
const inspectionsRouter = require('./inspections');

const router = express.Router();

// API Routes
router.use('/apiaries', apiariesRouter);
router.use('/hives', hivesRouter);
router.use('/supers', supersRouter);
router.use('/frames', framesRouter);
router.use('/inspections', inspectionsRouter);

// Health check endpoint
router.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'API is running',
        timestamp: new Date().toISOString()
    });
});

// API documentation endpoint
router.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Beekeeping App API',
        version: '1.0.0',
        endpoints: {
            apiaries: '/api/apiaries',
            hives: '/api/hives',
            supers: '/api/supers',
            frames: '/api/frames',
            inspections: '/api/inspections',
            health: '/api/health'
        }
    });
});

module.exports = router;