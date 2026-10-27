const express = require('express');
const { listTrips, createTrip, updateTrip, deleteTrip } = require('../controllers/ambulanceController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();
router.use(protect);
router.get('/', listTrips);
router.post('/', authorize('ANM', 'MEDICAL_OFFICER'), createTrip);
router.put('/:id', authorize('ANM', 'MEDICAL_OFFICER'), updateTrip);
router.delete('/:id', authorize('MEDICAL_OFFICER'), deleteTrip);

module.exports = router;
