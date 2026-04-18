const Message = require('../models/Message');
const Room = require('../models/Room');
const { redisClient } = require('../config/redis');

const handleSocketEvents = (io) => {

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);


    socket.on('user_online', async (userId) => {
      try {
        await redisClient.set(`user:${userId}`, socket.id);
        console.log(`User ${userId} is now online`);

        io.emit('user_status_changed', { userId, isOnline: true });
      } catch (error) {
        console.error('Error setting user online:', error);
      }
    });


    socket.on('join_room', (roomId) => {
      socket.join(roomId);
      console.log(`User joined room: ${roomId}`);
    });

    // ─── User Leaves a Chat Room ──────────────────────────────────
    socket.on('leave_room', (roomId) => {
      socket.leave(roomId);
      console.log(`User left room: ${roomId}`);
    });


    socket.on('send_message', async ({ roomId, senderId, content }) => {
      try {
        const message = await Message.create({
          sender: senderId,
          room: roomId,
          content,
          messageType: 'text',
          readBy: [senderId] 
        });

        await Room.findByIdAndUpdate(roomId, { lastMessage: message._id });

        const fullMessage = await Message.findById(message._id)
          .populate('sender', 'username email profilePicture');


        io.to(roomId).emit('receive_message', fullMessage);

      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('message_error', { message: 'Failed to send message' });
      }
    });


    socket.on('typing', ({ roomId, username }) => {
      
      socket.to(roomId).emit('user_typing', { username });
    });

    socket.on('stop_typing', ({ roomId }) => {
      socket.to(roomId).emit('user_stop_typing');
    });

 
    socket.on('messages_read', async ({ roomId, userId }) => {
      try {
        await Message.updateMany(
          {
            room: roomId,
            readBy: { $nin: [userId] } 
          },
          {
            $push: { readBy: userId }
          }
        );

        socket.to(roomId).emit('messages_read_update', { roomId, userId });

      } catch (error) {
        console.error('Error updating read receipts:', error);
      }
    });

    socket.on('disconnect', async () => {
      console.log(`User disconnected: ${socket.id}`);

      try {

        const keys = await redisClient.keys('user:*');

        for (const key of keys) {
          const storedSocketId = await redisClient.get(key);

          if (storedSocketId === socket.id) {
            const userId = key.split(':')[1];

            await redisClient.del(key);

            io.emit('user_status_changed', { userId, isOnline: false });

            console.log(`User ${userId} is now offline`);
            break;
          }
        }
      } catch (error) {
        console.error('Error handling disconnect:', error);
      }
    });

  });

};

module.exports = { handleSocketEvents };