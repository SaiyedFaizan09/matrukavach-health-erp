const express = require('express');
const { monthlyReport, villages } = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();
router.use(protect);
router.use(authorize('ANM', 'MEDICAL_OFFICER', 'BLOCK_ADMIN'));
router.get('/monthly', monthlyReport);
router.get('/villages', villages);

module.exports = router;
