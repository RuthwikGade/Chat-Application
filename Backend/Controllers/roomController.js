const Room = require('../models/Room');


exports.createRoom = async (req, res) => {
  try {
    const { name, members, isGroupChat } = req.body;

    const allMembers = [...new Set([...members, req.user._id.toString()])];

    if (!isGroupChat) {
      const existingRoom = await Room.findOne({
        isGroupChat: false,
        members: { $all: allMembers, $size: allMembers.length }
      })
        .populate('members', 'username email profilePicture isOnline')
        .populate('createdBy', 'username email');

      if (existingRoom) {
        return res.status(200).json(existingRoom);
      }
    }

    const room = await Room.create({
      name,
      members: allMembers,
      isGroupChat: isGroupChat || false,
      createdBy: req.user._id
    });

    const populatedRoom = await Room.findById(room._id)
      .populate('members', 'username email profilePicture isOnline')
      .populate('createdBy', 'username email');

    res.status(201).json(populatedRoom);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


exports.getRooms = async (req, res) => {
  try {
    // Find all rooms where the logged in user is a member
    const rooms = await Room.find({ members: { $in: [req.user._id] } })
      .populate('members', 'username email profilePicture isOnline')
      .populate('lastMessage')
      .populate('createdBy', 'username email')
      .sort({ updatedAt: -1 }); // most recently active rooms first

    res.status(200).json(rooms);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


exports.getRoomById = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id)
      .populate('members', 'username email profilePicture isOnline')
      .populate('lastMessage')
      .populate('createdBy', 'username email');

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    const isMember = room.members.some(
      member => member._id.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({ message: 'You are not a member of this room' });
    }

    res.status(200).json(room);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


exports.deleteRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    if (room.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the room creator can delete this room' });
    }

    await room.deleteOne();

    res.status(200).json({ message: 'Room deleted successfully' });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};