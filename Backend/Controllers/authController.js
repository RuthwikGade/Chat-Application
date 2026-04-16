const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const generateAccessToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '15m'
  });
};

const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: '7d'
  });
};

const accessTokenOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 15 * 60 * 1000  
};

const refreshTokenOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000  // 7 days
};

exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      username,
      email,
      password: hashedPassword
    });


    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    user.refreshToken = refreshToken;
    await user.save();

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

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;


    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }


    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }


    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);


    user.refreshToken = refreshToken;
    user.isOnline = true;
    await user.save();


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


exports.refresh = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ message: 'No refresh token' });
    }


    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);


    const user = await User.findById(decoded.id);
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }


    const newAccessToken = generateAccessToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    user.refreshToken = newRefreshToken;
    await user.save();


    res.cookie('accessToken', newAccessToken, accessTokenOptions);
    res.cookie('refreshToken', newRefreshToken, refreshTokenOptions);

    res.status(200).json({ message: 'Token refreshed' });

  } catch (error) {
    res.status(401).json({ message: 'Invalid refresh token, please login again' });
  }
};


exports.logout = async (req, res) => {
  try {
    // Clear refreshToken from DB
    const user = await User.findById(req.user._id);
    if (user) {
      user.refreshToken = null;
      user.isOnline = false;
      await user.save();
    }

    res.cookie('accessToken', '', { httpOnly: true, expires: new Date(0) });
    res.cookie('refreshToken', '', { httpOnly: true, expires: new Date(0) });

    res.status(200).json({ message: 'Logged out successfully' });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};