const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Generate Access Token
const generateAccessToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '15m'
  });
};

// Generate Refresh Token
const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: '7d'
  });
};

// Cookie options
const accessTokenOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 15 * 60 * 1000  // 15 minutes
};

const refreshTokenOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000  // 7 days
};

// @route POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      username,
      email,
      password: hashedPassword
    });

    // Generate tokens
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Store refreshToken in DB
    user.refreshToken = refreshToken;
    await user.save();

    // Send tokens as cookies
    res.cookie('accessToken', accessToken, accessTokenOptions);
    res.cookie('refreshToken', refreshToken, refreshTokenOptions);

    res.status(201).json({
      _id: user._id,
      username: user.username,
      email: user.email
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Store refreshToken in DB
    user.refreshToken = refreshToken;
    user.isOnline = true;
    await user.save();

    // Send tokens as cookies
    res.cookie('accessToken', accessToken, accessTokenOptions);
    res.cookie('refreshToken', refreshToken, refreshTokenOptions);

    res.status(200).json({
      _id: user._id,
      username: user.username,
      email: user.email
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route POST /api/auth/refresh
exports.refresh = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ message: 'No refresh token' });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    // Check if token exists in DB
    const user = await User.findById(decoded.id);
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    // Generate new tokens (token rotation)
    const newAccessToken = generateAccessToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    // Update refreshToken in DB
    user.refreshToken = newRefreshToken;
    await user.save();

    // Send new tokens
    res.cookie('accessToken', newAccessToken, accessTokenOptions);
    res.cookie('refreshToken', newRefreshToken, refreshTokenOptions);

    res.status(200).json({ message: 'Token refreshed' });

  } catch (error) {
    res.status(401).json({ message: 'Invalid refresh token, please login again' });
  }
};

// @route POST /api/auth/logout
exports.logout = async (req, res) => {
  try {
    // Clear refreshToken from DB
    const user = await User.findById(req.user._id);
    if (user) {
      user.refreshToken = null;
      user.isOnline = false;
      await user.save();
    }

    // Clear cookies
    res.cookie('accessToken', '', { httpOnly: true, expires: new Date(0) });
    res.cookie('refreshToken', '', { httpOnly: true, expires: new Date(0) });

    res.status(200).json({ message: 'Logged out successfully' });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};