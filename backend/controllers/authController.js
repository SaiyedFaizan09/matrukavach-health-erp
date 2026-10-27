const asyncHandler = require('express-async-handler');
const User = require('../models/User');

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: (email || '').toLowerCase().trim() });
  if (!user || !user.isActive || !(await user.matchPassword(password || ''))) {
    res.status(401);
    throw new Error('Invalid email or password');
  }
  res.json({ token: user.signToken(), user: user.toSafeJSON() });
});

const me = asyncHandler(async (req, res) => {
  res.json(req.user);
});

module.exports = { login, me };
