const express = require('express');
const dotenv = require('dotenv');
dotenv.config();
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/Database');
const { connectRedis } = require('./config/redis');



const app = express();

// Middleware
app.use(cors());
app.use(express.json());
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