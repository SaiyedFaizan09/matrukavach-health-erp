const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const { escapeRegex } = require('../utils/dateHelpers');

const listUsers = asyncHandler(async (req, res) => {
  const { q, role, village, isActive } = req.query;
  const filter = {};

  if (req.user && req.user.role === 'MEDICAL_OFFICER') {
    filter.phc = req.user.phc;
    if (role) {
      filter.role = new RegExp('^' + escapeRegex(role) + '$', 'i');
    } else {
      filter.role = { $in: ['ASHA', 'ANM'] };
    }
  } else if (role) {
    filter.role = new RegExp('^' + escapeRegex(role) + '$', 'i');
  }

  if (village) filter.village = new RegExp(escapeRegex(village), 'i');
  if (isActive === 'true') filter.isActive = true;
  if (isActive === 'false') filter.isActive = false;
  if (q) {
    const rx = new RegExp(escapeRegex(q), 'i');
    filter.$or = [{ name: rx }, { email: rx }, { phone: rx }, { village: rx }];
  }
  const users = await User.find(filter).select('-password').sort({ name: 1 });
  res.json(users);
});

const createUser = asyncHandler(async (req, res) => {
  const { name, email, phone, password, role, village, phc, isActive } = req.body;
  if (!name || !email || !phone || !password || !role) {
    res.status(400);
    throw new Error('Name, email, phone, password and role are required');
  }
  const exists = await User.findOne({ email: email.toLowerCase().trim() });
  if (exists) {
    res.status(409);
    throw new Error('User with this email already exists');
  }
  const user = await User.create({
    name,
    email,
    phone,
    password,
    role,
    village,
    phc,
    isActive: isActive !== false,
  });
  res.status(201).json(user.toSafeJSON());
});

const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  const fields = ['name', 'email', 'phone', 'role', 'village', 'phc', 'isActive'];
  fields.forEach((f) => {
    if (req.body[f] !== undefined) user[f] = req.body[f];
  });
  if (req.body.password) user.password = req.body.password;
  await user.save();
  res.json(user.toSafeJSON());
});

module.exports = { listUsers, createUser, updateUser };
