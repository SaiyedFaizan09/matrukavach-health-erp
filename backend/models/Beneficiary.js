const mongoose = require('mongoose');

const RISK_LEVELS = ['Normal', 'Moderate', 'Critical High-Risk'];
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'];
const TRIMESTERS = ['1st', '2nd', '3rd'];

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

const beneficiarySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    rchId: { type: String, required: true, unique: true, trim: true },
    abhaId: { type: String, default: '', trim: true },
    phone: { type: String, required: true, trim: true },
    village: { type: String, required: true, trim: true },
    assignedAsha: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    lmpDate: { type: Date, required: true },
    edd: { type: Date },
    baselineHb: { type: Number, default: null },
    bloodGroup: { type: String, enum: BLOOD_GROUPS, default: 'Unknown' },
    currentRiskLevel: { type: String, enum: RISK_LEVELS, default: 'Normal' },
    anemiaStatus: { type: String, default: 'Unknown' },
    pendingSupplements: { type: String, default: '' },
    nextVisitDate: { type: Date, default: null },
    lastVisitDate: { type: Date, default: null },
    lastGestWeek: { type: Number, default: null },
    notes: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

beneficiarySchema.pre('validate', function setEdd(next) {
  if (this.lmpDate) {
    this.edd = addDays(this.lmpDate, 280);
  }
  next();
});

beneficiarySchema.virtual('trimester').get(function trimester() {
  if (!this.lmpDate) return '1st';
  const weeks = Math.floor((Date.now() - new Date(this.lmpDate).getTime()) / (7 * 24 * 3600 * 1000));
  if (weeks < 14) return '1st';
  if (weeks < 28) return '2nd';
  return '3rd';
});

beneficiarySchema.set('toJSON', { virtuals: true });
beneficiarySchema.set('toObject', { virtuals: true });

beneficiarySchema.index({ name: 'text', rchId: 'text', phone: 'text', village: 'text' });

module.exports = mongoose.model('Beneficiary', beneficiarySchema);
module.exports.RISK_LEVELS = RISK_LEVELS;
module.exports.BLOOD_GROUPS = BLOOD_GROUPS;
module.exports.TRIMESTERS = TRIMESTERS;
