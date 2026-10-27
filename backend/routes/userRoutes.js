const express = require('express');
const { listUsers, createUser, updateUser } = require('../controllers/userController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();
router.use(protect);
router.use(authorize('MEDICAL_OFFICER', 'BLOCK_ADMIN'));

router.get('/', listUsers);
router.post('/', authorize('BLOCK_ADMIN'), createUser);
router.put('/:id', authorize('BLOCK_ADMIN'), updateUser);

module.exports = router;
