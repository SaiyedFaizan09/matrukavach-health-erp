const mongoose = require('mongoose');

const ambulanceLogSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true },
    vehicleNo: { type: String, required: true, trim: true, uppercase: true },
    driverName: { type: String, required: true, trim: true },
    route: { type: String, required: true, trim: true },
    village: { type: String, default: '', trim: true },
    referredMother: { type: mongoose.Schema.Types.ObjectId, ref: 'Beneficiary' },
    referredMotherName: { type: String, default: '' },
    referralReason: { type: String, default: '' },
    km: { type: Number, required: true, min: 0 },
    fuelLiters: { type: Number, default: 0, min: 0 },
    mileage: { type: Number, default: 0 },
    outcome: { type: String, default: 'Completed', trim: true },
    tripType: { type: String, enum: ['MMU Camp', '108 Referral', 'Other'], default: 'MMU Camp' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

ambulanceLogSchema.pre('validate', function calcMileage(next) {
  const liters = Number(this.fuelLiters) || 0;
  const km = Number(this.km) || 0;
  this.mileage = liters > 0 ? Number((km / liters).toFixed(2)) : 0;
  next();
});

ambulanceLogSchema.index({ date: -1, vehicleNo: 1 });

module.exports = mongoose.model('AmbulanceLog', ambulanceLogSchema);
