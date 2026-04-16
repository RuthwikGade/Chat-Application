const express = require('express');
const router = express.Router();
const { register, login, refresh, logout } = require('../Controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refresh);
router.post('/logout', protect, logout);

module.exports = router;