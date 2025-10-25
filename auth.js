const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { AppError } = require('../middleware/errorHandler');
const { validate, schemas } = require('../middleware/validation');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Generate JWT token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
router.post('/register', validate(schemas.register), async (req, res, next) => {
    try {
        const { name, email, password, phone, location } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return next(new AppError('User already exists with this email', 400, 'USER_EXISTS'));
        }

        // Hash password
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            phone,
            location
        });

        // Generate token
        const token = generateToken(user.id);

        // Remove password from response
        const userResponse = { ...user.toJSON() };
        delete userResponse.password;

        res.status(201).json({
            success: true,
            data: {
                user: userResponse,
                token
            }
        });

    } catch (error) {
        next(error);
    }
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
router.post('/login', validate(schemas.login), async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Find user by email
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return next(new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS'));
        }

        // Check if user is active
        if (!user.is_active) {
            return next(new AppError('Account is deactivated', 401, 'ACCOUNT_DEACTIVATED'));
        }

        // Validate password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return next(new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS'));
        }

        // Update last login
        await user.update({ last_login: new Date() });

        // Generate token
        const token = generateToken(user.id);

        // Remove password from response
        const userResponse = { ...user.toJSON() };
        delete userResponse.password;

        res.json({
            success: true,
            data: {
                user: userResponse,
                token
            }
        });

    } catch (error) {
        next(error);
    }
});

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
router.get('/me', protect, async (req, res) => {
    res.json({
        success: true,
        data: {
            user: req.user
        }
    });
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
router.put('/profile', protect, async (req, res, next) => {
    try {
        const { name, phone, location } = req.body;

        const updatedUser = await req.user.update({
            name: name || req.user.name,
            phone: phone || req.user.phone,
            location: location || req.user.location
        });

        res.json({
            success: true,
            data: {
                user: updatedUser
            }
        });

    } catch (error) {
        next(error);
    }
});

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
router.put('/change-password', protect, async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;

        // Validate current password
        const user = await User.findByPk(req.user.id);
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);

        if (!isCurrentPasswordValid) {
            return next(new AppError('Current password is incorrect', 400, 'INVALID_PASSWORD'));
        }

        // Hash new password
        const salt = await bcrypt.genSalt(12);
        const hashedNewPassword = await bcrypt.hash(newPassword, salt);

        // Update password
        await user.update({ password: hashedNewPassword });

        res.json({
            success: true,
            message: 'Password updated successfully'
        });

    } catch (error) {
        next(error);
    }
});

// @desc    Logout user (client-side token removal)
// @route   POST /api/auth/logout
// @access  Private
router.post('/logout', protect, (req, res) => {
    res.json({
        success: true,
        message: 'Logged out successfully'
    });
});

module.exports = router;