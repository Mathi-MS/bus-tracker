const User = require('../models/User');
const TrackingSession = require('../models/TrackingSession');

const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeSessions = await TrackingSession.countDocuments({ status: 'active' });
    
    const users = await User.find({}, 'shareCount viewCount');
    const totalShares = users.reduce((acc, u) => acc + (u.shareCount || 0), 0);
    const totalViews = users.reduce((acc, u) => acc + (u.viewCount || 0), 0);

    res.json({
      totalUsers,
      activeSessions,
      totalShares,
      totalViews
    });
  } catch (error) {
    console.error('Admin Stats Error:', error);
    res.status(500).json({ message: 'Error fetching admin stats' });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users' });
  }
};

const getActiveSessions = async (req, res) => {
  try {
    const sessions = await TrackingSession.find({ status: 'active' })
      .populate('sharer', 'name email picture')
      .sort({ startTime: -1 });
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching active sessions' });
  }
};

const getSessionHistory = async (req, res) => {
  try {
    const sessions = await TrackingSession.find({})
      .populate('sharer', 'name email')
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching session history' });
  }
};

module.exports = {
  getDashboardStats,
  getAllUsers,
  getActiveSessions,
  getSessionHistory,
};
