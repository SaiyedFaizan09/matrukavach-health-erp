const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');

function normalizeRole(r) {
  if (!r) return '';
  const up = String(r).toUpperCase().trim();
  if (up === 'PHC_MO') return 'MEDICAL_OFFICER';
  if (up === 'BLOCK_ADMIN') return 'BLOCK_ADMIN';
  if (up === 'ANM') return 'ANM';
  if (up === 'ASHA') return 'ASHA';
  return up;
}

const protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    res.status(401);
    throw new Error('Not authorized, token missing');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user || !user.isActive) {
      res.status(401);
      throw new Error('Not authorized, user inactive');
    }
    user.role = normalizeRole(user.role);
    req.user = user;
    next();
  } catch (err) {
    if (res.statusCode === 200) res.status(401);
    throw new Error(err.message || 'Not authorized, token invalid');
  }
});

const authorize =
  (...roles) =>
  (req, res, next) => {
    const allowed = roles.flat().map(normalizeRole);
    const userRole = normalizeRole(req.user?.role);
    if (!req.user || !allowed.includes(userRole)) {
      res.status(403);
      throw new Error('Forbidden: Insufficient role permissions');
    }
    next();
  };

module.exports = { protect, authorize };
