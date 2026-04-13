const express = require('express');
const { googleLogin, refresh, logout, updateProfile } = require('../controllers/authController');
const { verifyAccessToken } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/google', googleLogin);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.put('/profile', verifyAccessToken, updateProfile);

module.exports = router;
