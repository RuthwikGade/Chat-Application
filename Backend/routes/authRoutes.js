const express = require('express');
const router = express.Router();
const { register, login, refresh, logout } = require('../Controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { getOnlineUsers } = require('../config/redis');

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refresh);
router.post('/logout', protect, logout);

router.get('/online-users', protect, async (req, res) => {
  try {
    const onlineUsers = await getOnlineUsers();
    res.status(200).json(onlineUsers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;