const asyncHandler = require('express-async-handler');
const DailyCampSheet = require('../models/DailyCampSheet');
const ScreeningRecord = require('../models/ScreeningRecord');
const Beneficiary = require('../models/Beneficiary');
const { startOfDay, addDays, escapeRegex } = require('../utils/dateHelpers');
const { classifyAnemia } = require('../utils/clinicalRiskEngine');

function emptyKitLine(oldStock = 0) {
  return {
    oldStock,
    inflows: [
      { batchNo: '', supplier: '', quantity: 0 },
      { batchNo: '', supplier: '', quantity: 0 },
      { batchNo: '', supplier: '', quantity: 0 },
    ],
    dispatched: 0,
    damaged: 0,
    closing: oldStock,
  };
}

async function syncDispatched(sheet) {
  const rows = await ScreeningRecord.find({ campSheet: sheet._id });
  const totals = { ifa: 0, calcium: 0, poshan: 0, hbStrips: 0 };
  rows.forEach((r) => {
    totals.ifa += Number(r.kitsGiven?.ifa) || 0;
    totals.calcium += Number(r.kitsGiven?.calcium) || 0;
    totals.poshan += Number(r.kitsGiven?.poshan) || 0;
    totals.hbStrips += Number(r.kitsGiven?.hbStrips) || 0;
  });
  sheet.stock.ifa.dispatched = totals.ifa;
  sheet.stock.calcium.dispatched = totals.calcium;
  sheet.stock.poshan.dispatched = totals.poshan;
  sheet.stock.hbStrips.dispatched = totals.hbStrips;
  sheet.recalculate();
  await sheet.save();
  return sheet;
}

function assertUnlocked(sheet) {
  if (sheet.locked) {
    const err = new Error('Camp sheet is locked by Medical Officer');
    err.statusCode = 423;
    throw err;
  }
}

const getOrCreateSheet = asyncHandler(async (req, res) => {
  const date = startOfDay(req.query.date || new Date());
  const village = (req.query.village || 'Rampur').trim();
  let sheet = await DailyCampSheet.findOne({ date, village });
  if (!sheet) {
    const yesterday = await DailyCampSheet.findOne({
      date: startOfDay(addDays(date, -1)),
      village,
    });
    sheet = await DailyCampSheet.create({
      date,
      village,
      stock: {
        ifa: emptyKitLine(yesterday?.stock?.ifa?.closing || 0),
        calcium: emptyKitLine(yesterday?.stock?.calcium?.closing || 0),
        poshan: emptyKitLine(yesterday?.stock?.poshan?.closing || 0),
        hbStrips: emptyKitLine(yesterday?.stock?.hbStrips?.closing || 0),
      },
    });
  }

  await syncDispatched(sheet);
  const screenings = await ScreeningRecord.find({ campSheet: sheet._id })
    .populate({
      path: 'beneficiary',
      populate: { path: 'assignedAsha', select: 'name phone' },
    })
    .sort({ tokenNo: 1 });

  res.json({ sheet, screenings, summary: screeningSummary(screenings) });
});

function screeningSummary(screenings) {
  const total = screenings.length;
  const highRisk = screenings.filter((s) => s.riskStatus !== 'Normal').length;
  const critical = screenings.filter((s) => s.riskStatus === 'Critical High-Risk').length;
  const hbVals = screenings.map((s) => Number(s.hb)).filter((n) => Number.isFinite(n) && n > 0);
  const avgHb = hbVals.length ? Number((hbVals.reduce((a, b) => a + b, 0) / hbVals.length).toFixed(2)) : 0;
  const kits = screenings.reduce(
    (s, r) =>
      s +
      (Number(r.kitsGiven?.ifa) || 0) +
      (Number(r.kitsGiven?.calcium) || 0) +
      (Number(r.kitsGiven?.poshan) || 0),
    0
  );
  return { totalMothers: total, highRisk, critical, avgHb, kitsDispatched: kits };
}

const carryForward = asyncHandler(async (req, res) => {
  const date = startOfDay(req.body.date || new Date());
  const village = (req.body.village || 'Rampur').trim();
  const sheet = await DailyCampSheet.findOne({ date, village });
  if (!sheet) {
    res.status(404);
    throw new Error('Today camp sheet not found');
  }
  assertUnlocked(sheet);
  const yesterday = await DailyCampSheet.findOne({ date: startOfDay(addDays(date, -1)), village });
  if (!yesterday) {
    res.status(404);
    throw new Error('No previous day sheet to carry forward');
  }
  sheet.stock.ifa.oldStock = yesterday.stock.ifa.closing || 0;
  sheet.stock.calcium.oldStock = yesterday.stock.calcium.closing || 0;
  sheet.stock.poshan.oldStock = yesterday.stock.poshan.closing || 0;
  sheet.stock.hbStrips.oldStock = yesterday.stock.hbStrips.closing || 0;
  sheet.recalculate();
  await sheet.save();
  res.json(sheet);
});

const updateSheet = asyncHandler(async (req, res) => {
  const sheet = await DailyCampSheet.findById(req.params.id);
  if (!sheet) {
    res.status(404);
    throw new Error('Camp sheet not found');
  }
  assertUnlocked(sheet);
  if (req.body.stock) {
    ['ifa', 'calcium', 'poshan', 'hbStrips'].forEach((key) => {
      if (req.body.stock[key]) {
        const incoming = req.body.stock[key];
        if (incoming.oldStock !== undefined) sheet.stock[key].oldStock = incoming.oldStock;
        if (incoming.damaged !== undefined) sheet.stock[key].damaged = incoming.damaged;
        if (incoming.inflows) sheet.stock[key].inflows = incoming.inflows;
      }
    });
  }
  await syncDispatched(sheet);
  res.json(sheet);
});

const lockSheet = asyncHandler(async (req, res) => {
  const sheet = await DailyCampSheet.findById(req.params.id);
  if (!sheet) {
    res.status(404);
    throw new Error('Camp sheet not found');
  }
  if (req.user.role !== 'MEDICAL_OFFICER') {
    res.status(403);
    throw new Error('Only Medical Officer can lock the sheet');
  }
  sheet.locked = true;
  sheet.lockedBy = req.user._id;
  sheet.lockedAt = new Date();
  await sheet.save();
  res.json(sheet);
});

const unlockSheet = asyncHandler(async (req, res) => {
  const sheet = await DailyCampSheet.findById(req.params.id);
  if (!sheet) {
    res.status(404);
    throw new Error('Camp sheet not found');
  }
  if (req.user.role !== 'BLOCK_ADMIN') {
    res.status(403);
    throw new Error('Only Block Admin can unlock a locked camp sheet');
  }
  sheet.locked = false;
  sheet.lockedBy = null;
  sheet.lockedAt = null;
  await sheet.save();
  res.json(sheet);
});

const listScreenings = asyncHandler(async (req, res) => {
  const { date, village, q, riskLevel } = req.query;
  const filter = {};
  if (date) {
    const d = startOfDay(date);
    filter.campDate = d;
  }
  if (village) filter.village = new RegExp(escapeRegex(village), 'i');
  if (riskLevel) filter.riskStatus = riskLevel;
  let rows = await ScreeningRecord.find(filter)
    .populate({
      path: 'beneficiary',
      populate: { path: 'assignedAsha', select: 'name phone' },
    })
    .sort({ tokenNo: 1 });
  if (q) {
    const rx = new RegExp(escapeRegex(q), 'i');
    rows = rows.filter(
      (r) =>
        rx.test(r.beneficiary?.name || '') ||
        rx.test(r.beneficiary?.rchId || '') ||
        rx.test(r.beneficiary?.phone || '') ||
        rx.test(r.village || '')
    );
  }
  res.json(rows);
});

const createScreening = asyncHandler(async (req, res) => {
  const sheet = await DailyCampSheet.findById(req.body.campSheet);
  if (!sheet) {
    res.status(404);
    throw new Error('Camp sheet not found');
  }
  assertUnlocked(sheet);

  const last = await ScreeningRecord.findOne({ campSheet: sheet._id }).sort({ tokenNo: -1 });
  const tokenNo = req.body.tokenNo || (last ? last.tokenNo + 1 : 1);
  const saved = await ScreeningRecord.create({
    campSheet: sheet._id,
    campDate: sheet.date,
    village: sheet.village,
    tokenNo,
    beneficiary: req.body.beneficiary,
    gestWeek: req.body.gestWeek,
    hb: req.body.hb,
    bpSystolic: req.body.bpSystolic,
    bpDiastolic: req.body.bpDiastolic,
    bloodSugar: req.body.bloodSugar,
    weightKg: req.body.weightKg,
    kitsGiven: req.body.kitsGiven || {},
    notes: req.body.notes || '',
    createdBy: req.user._id,
  });

  const mother = await Beneficiary.findById(req.body.beneficiary);
  if (mother) {
    mother.currentRiskLevel = saved.riskStatus;
    mother.anemiaStatus = classifyAnemia(saved.hb);
    mother.lastVisitDate = sheet.date;
    mother.lastGestWeek = saved.gestWeek;
    mother.nextVisitDate = saved.nextVisitDate;
    await mother.save();
  }

  await syncDispatched(sheet);
  const populated = await ScreeningRecord.findById(saved._id).populate({
    path: 'beneficiary',
    populate: { path: 'assignedAsha', select: 'name phone' },
  });
  res.status(201).json(populated);
});

const updateScreening = asyncHandler(async (req, res) => {
  const record = await ScreeningRecord.findById(req.params.id);
  if (!record) {
    res.status(404);
    throw new Error('Screening not found');
  }
  const sheet = await DailyCampSheet.findById(record.campSheet);
  assertUnlocked(sheet);

  const fields = [
    'beneficiary',
    'gestWeek',
    'hb',
    'bpSystolic',
    'bpDiastolic',
    'bloodSugar',
    'weightKg',
    'notes',
    'healthCardSent',
  ];
  fields.forEach((f) => {
    if (req.body[f] !== undefined) record[f] = req.body[f];
  });
  if (req.body.kitsGiven) record.kitsGiven = { ...record.kitsGiven.toObject(), ...req.body.kitsGiven };
  await record.save();

  const mother = await Beneficiary.findById(record.beneficiary);
  if (mother) {
    mother.currentRiskLevel = record.riskStatus;
    mother.anemiaStatus = classifyAnemia(record.hb);
    mother.lastVisitDate = record.campDate;
    mother.lastGestWeek = record.gestWeek;
    mother.nextVisitDate = record.nextVisitDate;
    await mother.save();
  }
  await syncDispatched(sheet);
  const populated = await ScreeningRecord.findById(record._id).populate({
    path: 'beneficiary',
    populate: { path: 'assignedAsha', select: 'name phone' },
  });
  res.json(populated);
});

const deleteScreening = asyncHandler(async (req, res) => {
  const record = await ScreeningRecord.findById(req.params.id);
  if (!record) {
    res.status(404);
    throw new Error('Screening not found');
  }
  const sheet = await DailyCampSheet.findById(record.campSheet);
  assertUnlocked(sheet);
  await record.deleteOne();
  await syncDispatched(sheet);
  res.json({ message: 'Screening deleted' });
});

const markCardSent = asyncHandler(async (req, res) => {
  const record = await ScreeningRecord.findById(req.params.id);
  if (!record) {
    res.status(404);
    throw new Error('Screening not found');
  }
  record.healthCardSent = true;
  record.healthCardSentAt = new Date();
  await record.save();
  res.json(record);
});

module.exports = {
  getOrCreateSheet,
  carryForward,
  updateSheet,
  lockSheet,
  unlockSheet,
  listScreenings,
  createScreening,
  updateScreening,
  deleteScreening,
  markCardSent,
};
