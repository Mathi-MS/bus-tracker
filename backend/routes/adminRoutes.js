const express = require('express');
const { 
  getDashboardStats, 
  getAllUsers, 
  getActiveSessions, 
  getSessionHistory 
} = require('../controllers/adminController');
const { verifyAccessToken, verifyAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(verifyAccessToken);
router.use(verifyAdmin);

router.get('/stats', getDashboardStats);
router.get('/users', getAllUsers);
router.get('/active-sessions', getActiveSessions);
router.get('/history', getSessionHistory);

module.exports = router;
