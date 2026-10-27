const mongoose = require('mongoose');

const inflowSchema = new mongoose.Schema(
  {
    batchNo: { type: String, default: '' },
    supplier: { type: String, default: '' },
    quantity: { type: Number, default: 0 },
  },
  { _id: true }
);

const kitLineSchema = new mongoose.Schema(
  {
    oldStock: { type: Number, default: 0 },
    inflows: { type: [inflowSchema], default: () => [{}, {}, {}] },
    dispatched: { type: Number, default: 0 },
    damaged: { type: Number, default: 0 },
    closing: { type: Number, default: 0 },
  },
  { _id: false }
);

const dailyCampSheetSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true },
    village: { type: String, required: true, trim: true },
    stock: {
      ifa: { type: kitLineSchema, default: () => ({}) },
      calcium: { type: kitLineSchema, default: () => ({}) },
      poshan: { type: kitLineSchema, default: () => ({}) },
      hbStrips: { type: kitLineSchema, default: () => ({}) },
    },
    locked: { type: Boolean, default: false },
    lockedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    lockedAt: { type: Date },
  },
  { timestamps: true }
);

dailyCampSheetSchema.index({ date: 1, village: 1 }, { unique: true });

function inflowSum(line) {
  return (line.inflows || []).reduce((s, row) => s + (Number(row.quantity) || 0), 0);
}

dailyCampSheetSchema.methods.recalculate = function recalculate() {
  const keys = ['ifa', 'calcium', 'poshan', 'hbStrips'];
  keys.forEach((key) => {
    const line = this.stock[key];
    const gross = (Number(line.oldStock) || 0) + inflowSum(line);
    const remaining = gross - (Number(line.dispatched) || 0);
    line.closing = remaining - (Number(line.damaged) || 0);
  });
};

dailyCampSheetSchema.pre('save', function beforeSave(next) {
  this.recalculate();
  next();
});

module.exports = mongoose.model('DailyCampSheet', dailyCampSheetSchema);
module.exports.inflowSum = inflowSum;
