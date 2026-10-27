const express = require('express');
const {
  listBeneficiaries,
  getWatchlist,
  getEddAlerts,
  getBeneficiary,
  getTimeline,
  createBeneficiary,
  updateBeneficiary,
} = require('../controllers/beneficiaryController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();
router.use(protect);
router.get('/', listBeneficiaries);
router.get('/watchlist', getWatchlist);
router.get('/edd-alerts', getEddAlerts);
router.post('/', authorize('ANM', 'MEDICAL_OFFICER'), createBeneficiary);
router.get('/:id/timeline', getTimeline);
router.get('/:id', getBeneficiary);
router.put('/:id', authorize('ANM', 'MEDICAL_OFFICER'), updateBeneficiary);

module.exports = router;
