const express = require('express');
const { login, me } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();
router.post('/login', login);
router.get('/me', protect, me);

module.exports = router;
