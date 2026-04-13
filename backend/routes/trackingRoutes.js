const express = require('express');
const { startSharing, stopSharing, getSession } = require('../controllers/trackingController');
const { verifyAccessToken } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/start', verifyAccessToken, startSharing);
router.post('/stop', verifyAccessToken, stopSharing);
router.get('/:code', verifyAccessToken, getSession);

module.exports = router;
