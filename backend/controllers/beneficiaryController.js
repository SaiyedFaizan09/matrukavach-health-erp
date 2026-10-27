const asyncHandler = require('express-async-handler');
const Beneficiary = require('../models/Beneficiary');
const ScreeningRecord = require('../models/ScreeningRecord');
const User = require('../models/User');
const { startOfDay, addDays, escapeRegex } = require('../utils/dateHelpers');
const { classifyAnemia } = require('../utils/clinicalRiskEngine');

function trimesterFromLmp(lmpDate) {
  const weeks = Math.floor((Date.now() - new Date(lmpDate).getTime()) / (7 * 24 * 3600 * 1000));
  if (weeks < 14) return '1st';
  if (weeks < 28) return '2nd';
  return '3rd';
}

const listBeneficiaries = asyncHandler(async (req, res) => {
  const { q, village, riskLevel, asha, anemiaStatus, trimester, from, to } = req.query;
  const filter = { isActive: true };

  // ASHA is restricted strictly to mothers mapped to her specific village
  if (req.user && req.user.role === 'ASHA') {
    filter.village = new RegExp('^' + escapeRegex(req.user.village || '') + '$', 'i');
  } else if (village) {
    filter.village = new RegExp(escapeRegex(village), 'i');
  }

  if (riskLevel) filter.currentRiskLevel = riskLevel;
  if (anemiaStatus) filter.anemiaStatus = anemiaStatus;
  if (asha) filter.assignedAsha = asha;
  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(from);
    if (to) filter.createdAt.$lte = new Date(to);
  }
  if (q) {
    const rx = new RegExp(escapeRegex(q), 'i');
    filter.$or = [{ name: rx }, { rchId: rx }, { phone: rx }, { village: rx }, { abhaId: rx }];
  }

  let rows = await Beneficiary.find(filter).populate('assignedAsha', 'name phone village').sort({ name: 1 });
  if (trimester) {
    rows = rows.filter((b) => trimesterFromLmp(b.lmpDate) === trimester);
  }
  res.json(rows);
});

const getWatchlist = asyncHandler(async (req, res) => {
  const today = startOfDay(new Date());
  const in14 = addDays(today, 14);

  const baseFilter = { isActive: true };
  if (req.user && req.user.role === 'ASHA') {
    baseFilter.village = new RegExp('^' + escapeRegex(req.user.village || '') + '$', 'i');
  }

  const critical = await Beneficiary.find({
    ...baseFilter,
    currentRiskLevel: 'Critical High-Risk',
  }).populate('assignedAsha', 'name phone');

  const dueDelivery = await Beneficiary.find({
    ...baseFilter,
    edd: { $gte: today, $lte: in14 },
  }).populate('assignedAsha', 'name phone');

  const overdue = await Beneficiary.find({
    ...baseFilter,
    nextVisitDate: { $ne: null, $lt: today },
  }).populate('assignedAsha', 'name phone');

  res.json({ critical, dueDelivery, overdue });
});

const getEddAlerts = asyncHandler(async (req, res) => {
  const today = startOfDay(new Date());
  const in7 = addDays(today, 7);

  const filter = {
    isActive: true,
    edd: { $gte: today, $lte: in7 },
  };
  if (req.user && req.user.role === 'ASHA') {
    filter.village = new RegExp('^' + escapeRegex(req.user.village || '') + '$', 'i');
  }

  const mothers = await Beneficiary.find(filter).populate('assignedAsha', 'name phone village');
  res.json(mothers);
});

const getBeneficiary = asyncHandler(async (req, res) => {
  const row = await Beneficiary.findById(req.params.id).populate('assignedAsha', 'name phone village');
  if (!row) {
    res.status(404);
    throw new Error('Beneficiary not found');
  }
  if (req.user && req.user.role === 'ASHA') {
    if (row.village.toLowerCase() !== (req.user.village || '').toLowerCase()) {
      res.status(403);
      throw new Error('Forbidden: ASHA can only access mothers mapped to her assigned village');
    }
  }
  res.json(row);
});

const getTimeline = asyncHandler(async (req, res) => {
  const rows = await ScreeningRecord.find({ beneficiary: req.params.id })
    .sort({ campDate: 1, createdAt: 1 })
    .populate('createdBy', 'name role');
  res.json(rows);
});

const createBeneficiary = asyncHandler(async (req, res) => {
  const {
    name,
    rchId,
    abhaId,
    phone,
    village,
    assignedAsha,
    lmpDate,
    baselineHb,
    bloodGroup,
    currentRiskLevel,
    pendingSupplements,
    notes,
  } = req.body;

  if (!name || !rchId || !phone || !village || !lmpDate) {
    res.status(400);
    throw new Error('Name, RCH ID, phone, village and LMP date are required');
  }

  const exists = await Beneficiary.findOne({ rchId: rchId.trim() });
  if (exists) {
    res.status(409);
    throw new Error('Beneficiary with this RCH ID already exists');
  }

  if (assignedAsha) {
    const asha = await User.findById(assignedAsha);
    if (!asha) {
      res.status(400);
      throw new Error('Assigned ASHA not found');
    }
  }

  const row = await Beneficiary.create({
    name,
    rchId,
    abhaId,
    phone,
    village,
    assignedAsha: assignedAsha || undefined,
    lmpDate,
    baselineHb,
    bloodGroup: bloodGroup || 'Unknown',
    currentRiskLevel: currentRiskLevel || 'Normal',
    anemiaStatus: classifyAnemia(baselineHb),
    pendingSupplements,
    notes,
  });
  const populated = await row.populate('assignedAsha', 'name phone village');
  res.status(201).json(populated);
});

const updateBeneficiary = asyncHandler(async (req, res) => {
  const row = await Beneficiary.findById(req.params.id);
  if (!row) {
    res.status(404);
    throw new Error('Beneficiary not found');
  }
  const fields = [
    'name',
    'rchId',
    'abhaId',
    'phone',
    'village',
    'assignedAsha',
    'lmpDate',
    'baselineHb',
    'bloodGroup',
    'currentRiskLevel',
    'pendingSupplements',
    'notes',
    'isActive',
    'nextVisitDate',
  ];
  fields.forEach((f) => {
    if (req.body[f] !== undefined) row[f] = req.body[f];
  });
  if (req.body.baselineHb !== undefined) row.anemiaStatus = classifyAnemia(row.baselineHb);
  await row.save();
  res.json(await row.populate('assignedAsha', 'name phone village'));
});

module.exports = {
  listBeneficiaries,
  getWatchlist,
  getEddAlerts,
  getBeneficiary,
  getTimeline,
  createBeneficiary,
  updateBeneficiary,
};
