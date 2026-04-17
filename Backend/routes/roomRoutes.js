const express = require('express');
const router = express.Router();
const { createRoom, getRooms, getRoomById, deleteRoom } = require('../Controllers/roomController');
const { getMessages, deleteMessage } = require('../Controllers/messageController');
const { protect } = require('../middleware/authMiddleware');


router.post('/', protect, createRoom);           
router.get('/', protect, getRooms);              
router.get('/:id', protect, getRoomById);        
router.delete('/:id', protect, deleteRoom);      


router.get('/:id/messages', protect, getMessages);       
router.delete('/messages/:id', protect, deleteMessage);  

module.exports = router;