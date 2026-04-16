const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  try {
    const token = req.cookies.accessToken;

    if (!token) {
      return res.status(401).json({ message: 'Not authorized, no token' });
    }

    // Verify access token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user to request
    req.user = await User.findById(decoded.id).select('-password -refreshToken');

    next();

  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired', expired: true });
    }
    res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

module.exports = { protect };