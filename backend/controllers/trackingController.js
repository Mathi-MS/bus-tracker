const TrackingSession = require('../models/TrackingSession');
const crypto = require('crypto');

const generateCode = () => {
  return crypto.randomBytes(3).toString('hex').toUpperCase();
};

const startSharing = async (req, res) => {
  try {
    // Deactivate any existing active sessions for this user
    await TrackingSession.updateMany(
      { sharer: req.user.id, status: 'active' },
      { status: 'inactive', endTime: Date.now() }
    );

    const code = generateCode();
    const session = await TrackingSession.create({
      code,
      sharer: req.user.id,
      status: 'active',
    });
    
    // Increment user share count
    const User = require('../models/User');
    await User.findByIdAndUpdate(req.user.id, { $inc: { shareCount: 1 } });

    res.status(201).json(session);
  } catch (error) {
    res.status(500).json({ message: 'Failed to start sharing' });
  }
};

const stopSharing = async (req, res) => {
  const { code } = req.body;
  try {
    const session = await TrackingSession.findOneAndUpdate(
      { code, sharer: req.user.id },
      { status: 'inactive', endTime: Date.now() },
      { new: true }
    );
    if (!session) return res.status(404).json({ message: 'Session not found' });
    res.json(session);
  } catch (error) {
    res.status(500).json({ message: 'Failed to stop sharing' });
  }
};

const getSession = async (req, res) => {
  const { code } = req.params;
  try {
    const session = await TrackingSession.findOne({ code, status: 'active' }).populate('sharer', 'name picture');
    if (!session) return res.status(404).json({ message: 'Active session not found' });
    
    // Increment total views for session and sharer
    session.totalViews += 1;
    await session.save();
    
    const User = require('../models/User');
    await User.findByIdAndUpdate(session.sharer._id, { $inc: { viewCount: 1 } });

    res.json(session);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching session' });
  }
};

module.exports = {
  startSharing,
  stopSharing,
  getSession,
};
