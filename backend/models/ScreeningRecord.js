const mongoose = require('mongoose');
const {
  calculateMaternalRisk,
  suggestedNextVisitDays,
  classifyAnemia,
  RISK,
} = require('../utils/clinicalRiskEngine');

const screeningRecordSchema = new mongoose.Schema(
  {
    campSheet: { type: mongoose.Schema.Types.ObjectId, ref: 'DailyCampSheet', required: true },
    campDate: { type: Date, required: true },
    village: { type: String, required: true, trim: true },
    tokenNo: { type: Number, required: true },
    beneficiary: { type: mongoose.Schema.Types.ObjectId, ref: 'Beneficiary', required: true },
    gestWeek: { type: Number, min: 1, max: 42, default: 12 },
    hb: { type: Number, default: null },
    bpSystolic: { type: Number, default: null },
    bpDiastolic: { type: Number, default: null },
    bloodSugar: { type: Number, default: null },
    weightKg: { type: Number, default: null },
    riskStatus: { type: String, default: RISK.NORMAL },
    anemiaStatus: { type: String, default: 'Unknown' },
    kitsGiven: {
      ifa: { type: Number, default: 0 },
      calcium: { type: Number, default: 0 },
      poshan: { type: Number, default: 0 },
      hbStrips: { type: Number, default: 0 },
    },
    nextVisitDays: { type: Number, default: 30 },
    nextVisitDate: { type: Date },
    healthCardSent: { type: Boolean, default: false },
    healthCardSentAt: { type: Date },
    notes: { type: String, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

screeningRecordSchema.index({ campSheet: 1, tokenNo: 1 }, { unique: true });
screeningRecordSchema.index({ beneficiary: 1, campDate: -1 });

screeningRecordSchema.methods.applyClinicalRules = function applyClinicalRules() {
  this.riskStatus = calculateMaternalRisk({
    hb: this.hb,
    bpSystolic: this.bpSystolic,
    bpDiastolic: this.bpDiastolic,
    bloodSugar: this.bloodSugar,
  });
  this.anemiaStatus = classifyAnemia(this.hb);
  this.nextVisitDays = suggestedNextVisitDays(this.riskStatus);
  if (this.campDate) {
    const d = new Date(this.campDate);
    d.setDate(d.getDate() + this.nextVisitDays);
    this.nextVisitDate = d;
  }
};

screeningRecordSchema.pre('validate', function beforeValidate(next) {
  this.applyClinicalRules();
  next();
});

module.exports = mongoose.model('ScreeningRecord', screeningRecordSchema);
