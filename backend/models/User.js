const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const ROLES = ['ASHA', 'ANM', 'MEDICAL_OFFICER', 'BLOCK_ADMIN'];

function normalizeRole(r) {
  if (!r) return 'ASHA';
  const up = String(r).toUpperCase().trim();
  if (up === 'PHC_MO') return 'MEDICAL_OFFICER';
  if (up === 'BLOCK_ADMIN') return 'BLOCK_ADMIN';
  if (up === 'ANM') return 'ANM';
  if (up === 'ASHA') return 'ASHA';
  return up;
}

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    role: { type: String, enum: ROLES, required: true, set: normalizeRole },
    village: { type: String, default: '', trim: true },
    phc: { type: String, default: 'PHC Rampur', trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = function matchPassword(plain) {
  return bcrypt.compare(plain, this.password);
};

userSchema.methods.signToken = function signToken() {
  return jwt.sign({ id: this._id, role: normalizeRole(this.role) }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

userSchema.methods.toSafeJSON = function toSafeJSON() {
  return {
    _id: this._id,
    name: this.name,
    email: this.email,
    phone: this.phone,
    role: normalizeRole(this.role),
    village: this.village,
    phc: this.phc,
    isActive: this.isActive,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model('User', userSchema);
module.exports.ROLES = ROLES;
module.exports.normalizeRole = normalizeRole;
