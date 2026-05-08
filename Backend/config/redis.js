const redis = require('redis');

const redisClient = redis.createClient({
  socket: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT
  },
  password: process.env.REDIS_PASSWORD
});

redisClient.on('connect', () => console.log('Redis Connected'));
redisClient.on('error', (err) => console.error(`Redis Error:`, err));
const connectRedis = async () => {
  await redisClient.connect();
};

const setUserOnline = async (userId, socketId) => {
  await redisClient.set(`user:${userId}:socketId`, socketId);
  await redisClient.sAdd('onlineUsers', userId.toString());
};

const setUserOffline = async (userId) => {
  await redisClient.del(`user:${userId}:socketId`);
  await redisClient.sRem('onlineUsers', userId.toString());
};

const getOnlineUsers = async () => {
  return await redisClient.sMembers('onlineUsers');
};

const isUserOnline = async (userId) => {
  return await redisClient.sIsMember('onlineUsers', userId.toString());
};


const cacheMessage = async (roomId, message) => {
  const key = `room:${roomId}:messages`;

  await redisClient.rPush(key, JSON.stringify(message));

  await redisClient.lTrim(key, -50, -1);

  await redisClient.expire(key, 3600);
};

const getCachedMessages = async (roomId) => {
  const key = `room:${roomId}:messages`;
  const messages = await redisClient.lRange(key, 0, -1);

  return messages.map(msg => JSON.parse(msg));
};

const clearRoomCache = async (roomId) => {
  await redisClient.del(`room:${roomId}:messages`);
};

module.exports = {
  redisClient,
  connectRedis,
  setUserOnline,
  setUserOffline,
  getOnlineUsers,
  isUserOnline,
  cacheMessage,
  getCachedMessages,
  clearRoomCache
};