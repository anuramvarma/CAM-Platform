const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/login', authController.login);
router.post('/register', authController.register); // Optional/Admin only in real app

// Profile & Settings
const authMiddleware = require('../middleware/authMiddleware');
router.get('/me', authMiddleware, authController.getProfile);
router.post('/change-password', authMiddleware, authController.changePassword);

module.exports = router;
