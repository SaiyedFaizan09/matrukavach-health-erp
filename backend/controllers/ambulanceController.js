const asyncHandler = require('express-async-handler');
const AmbulanceLog = require('../models/AmbulanceLog');
const { startOfDay, escapeRegex } = require('../utils/dateHelpers');

const listTrips = asyncHandler(async (req, res) => {
  const { q, village, from, to, tripType } = req.query;
  const filter = {};
  if (req.user && req.user.role === 'ASHA') {
    filter.village = new RegExp('^' + escapeRegex(req.user.village || '') + '$', 'i');
  } else if (village) {
    filter.village = new RegExp(escapeRegex(village), 'i');
  }
  if (tripType) filter.tripType = tripType;
  if (from || to) {
    filter.date = {};
    if (from) filter.date.$gte = startOfDay(from);
    if (to) filter.date.$lte = startOfDay(to);
  }
  if (q) {
    const rx = new RegExp(escapeRegex(q), 'i');
    filter.$or = [
      { vehicleNo: rx },
      { driverName: rx },
      { route: rx },
      { referredMotherName: rx },
      { village: rx },
    ];
  }
  const rows = await AmbulanceLog.find(filter)
    .populate('referredMother', 'name phone rchId')
    .sort({ date: -1, createdAt: -1 });
  const totals = rows.reduce(
    (acc, r) => {
      acc.km += r.km || 0;
      acc.fuel += r.fuelLiters || 0;
      if (r.tripType === '108 Referral') acc.referrals += 1;
      return acc;
    },
    { km: 0, fuel: 0, referrals: 0 }
  );
  res.json({ rows, totals });
});

const createTrip = asyncHandler(async (req, res) => {
  const body = { ...req.body, createdBy: req.user._id };
  if (body.date) body.date = startOfDay(body.date);
  const row = await AmbulanceLog.create(body);
  res.status(201).json(await row.populate('referredMother', 'name phone rchId'));
});

const updateTrip = asyncHandler(async (req, res) => {
  const row = await AmbulanceLog.findById(req.params.id);
  if (!row) {
    res.status(404);
    throw new Error('Trip not found');
  }
  const fields = [
    'date',
    'vehicleNo',
    'driverName',
    'route',
    'village',
    'referredMother',
    'referredMotherName',
    'referralReason',
    'km',
    'fuelLiters',
    'outcome',
    'tripType',
  ];
  fields.forEach((f) => {
    if (req.body[f] !== undefined) row[f] = f === 'date' ? startOfDay(req.body[f]) : req.body[f];
  });
  await row.save();
  res.json(await row.populate('referredMother', 'name phone rchId'));
});

const deleteTrip = asyncHandler(async (req, res) => {
  const row = await AmbulanceLog.findById(req.params.id);
  if (!row) {
    res.status(404);
    throw new Error('Trip not found');
  }
  await row.deleteOne();
  res.json({ message: 'Trip deleted' });
});

module.exports = { listTrips, createTrip, updateTrip, deleteTrip };
