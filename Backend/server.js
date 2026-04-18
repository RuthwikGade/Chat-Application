const express = require('express');
const dotenv = require('dotenv');
dotenv.config();
const cors = require('cors');
const morgan = require('morgan');
const http = require('http');
const { Server } = require('socket.io');

const connectDB = require('./config/Database');
const { connectRedis } = require('./config/redis');
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/authRoutes');
const roomRoutes = require('./routes/roomRoutes');
const { handleSocketEvents } = require('./socket/socketHandler');
const app = express();

// Middleware
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(morgan('dev'));

//DataBase connection
connectDB();
connectRedis();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);


// HTTP + Socket.IO Setup
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000',
    credentials: true
  }
});

handleSocketEvents(io);

//Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});