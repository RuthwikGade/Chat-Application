const express = require('express');
const dotenv = require('dotenv');
dotenv.config();
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/Database');
const { connectRedis } = require('./config/redis');
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/authRoutes');


const app = express();

// Middleware
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(morgan('dev'));

//DataBase connection
connectDB();
connectRedis();

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'Chat API is running' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});