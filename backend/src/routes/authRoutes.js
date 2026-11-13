
const express = require('express');
const router = express.Router();

const {
    login,
    logout,
    getMe,
    createUser,
    changePassword,
    forgotPassword,
    resetPassword,
    unlockUser
} = require('../controllers/authController');

const {
    authenticate,
    authorize
} = require('../middleware/authMiddleware');

// Login
router.post('/login', login);

// Logout
router.post('/logout', authenticate, logout);

// Get logged-in user
router.get('/me', authenticate, getMe);

// Create user - Admin only
router.post(
    '/users',
    authenticate,
    authorize('admin'),
    createUser
);

// Change password
router.post(
    '/change-password',
    authenticate,
    changePassword
);

// Forgot password
router.post('/forgot-password', forgotPassword);

// Reset password
router.post('/reset-password', resetPassword);

// Unlock user - Admin only
router.patch(
    '/users/:id/unlock',
    authenticate,
    authorize('admin'),
    unlockUser
);

module.exports = router;
