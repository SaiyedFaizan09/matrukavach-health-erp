const express = require('express');
const {
  getOrCreateSheet,
  carryForward,
  updateSheet,
  lockSheet,
  unlockSheet,
  listScreenings,
  createScreening,
  updateScreening,
  deleteScreening,
  markCardSent,
} = require('../controllers/dailyCampController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();
router.use(protect);
router.use(authorize('ANM', 'MEDICAL_OFFICER', 'BLOCK_ADMIN'));

router.get('/', getOrCreateSheet);
router.post('/carry-forward', authorize('ANM', 'MEDICAL_OFFICER'), carryForward);
router.get('/screenings', listScreenings);
router.post('/screenings', authorize('ANM', 'MEDICAL_OFFICER'), createScreening);
router.put('/screenings/:id', authorize('ANM', 'MEDICAL_OFFICER'), updateScreening);
router.delete('/screenings/:id', authorize('ANM', 'MEDICAL_OFFICER'), deleteScreening);
router.post('/screenings/:id/send-card', authorize('ANM', 'MEDICAL_OFFICER'), markCardSent);
router.put('/:id', authorize('ANM', 'MEDICAL_OFFICER'), updateSheet);
router.post('/:id/lock', authorize('MEDICAL_OFFICER'), lockSheet);
router.post('/:id/unlock', authorize('BLOCK_ADMIN'), unlockSheet);

module.exports = router;
