const asyncHandler = require('express-async-handler');
const DailyCampSheet = require('../models/DailyCampSheet');
const ScreeningRecord = require('../models/ScreeningRecord');
const AmbulanceLog = require('../models/AmbulanceLog');
const { daysInMonth, startOfDay, ymd } = require('../utils/dateHelpers');
const { inflowSum } = require('../models/DailyCampSheet');

const monthlyReport = asyncHandler(async (req, res) => {
  const year = Number(req.query.year) || new Date().getFullYear();
  const month = Number(req.query.month) || new Date().getMonth() + 1;
  let village = (req.query.village || '').trim();
  if (req.user && req.user.role === 'ANM') {
    village = req.user.village || 'Rampur';
  }
  const dim = daysInMonth(year, month - 1);
  const from = startOfDay(new Date(year, month - 1, 1));
  const to = new Date(year, month - 1, dim, 23, 59, 59, 999);

  const sheetFilter = { date: { $gte: from, $lte: to } };
  const screeningFilter = { campDate: { $gte: from, $lte: to } };
  const tripFilter = { date: { $gte: from, $lte: to } };
  if (village) {
    sheetFilter.village = village;
    screeningFilter.village = village;
    tripFilter.village = village;
  }

  const sheets = await DailyCampSheet.find(sheetFilter);
  const screenings = await ScreeningRecord.find(screeningFilter);
  const trips = await AmbulanceLog.find(tripFilter);

  const days = [];
  for (let d = 1; d <= dim; d += 1) {
    const date = startOfDay(new Date(year, month - 1, d));
    const key = ymd(date);
    const daySheets = sheets.filter((s) => ymd(s.date) === key);
    const dayScreens = screenings.filter((s) => ymd(s.campDate) === key);
    const dayTrips = trips.filter((t) => ymd(t.date) === key);

    const kitsReceived = daySheets.reduce(
      (sum, s) =>
        sum +
        inflowSum(s.stock.ifa) +
        inflowSum(s.stock.calcium) +
        inflowSum(s.stock.poshan),
      0
    );
    const stripsReceived = daySheets.reduce((sum, s) => sum + inflowSum(s.stock.hbStrips), 0);
    const kitsDistributed = dayScreens.reduce(
      (sum, r) =>
        sum +
        (r.kitsGiven.ifa || 0) +
        (r.kitsGiven.calcium || 0) +
        (r.kitsGiven.poshan || 0),
      0
    );
    const closingKitStock = daySheets.reduce(
      (sum, s) =>
        sum +
        (s.stock.ifa.closing || 0) +
        (s.stock.calcium.closing || 0) +
        (s.stock.poshan.closing || 0) +
        (s.stock.hbStrips.closing || 0),
      0
    );
    const hbVals = dayScreens.map((s) => Number(s.hb)).filter((n) => Number.isFinite(n) && n > 0);

    days.push({
      date: key,
      day: d,
      kitsReceived,
      stripsReceived,
      mothersScreened: dayScreens.length,
      moderateRisk: dayScreens.filter((s) => s.riskStatus === 'Moderate').length,
      criticalRisk: dayScreens.filter((s) => s.riskStatus === 'Critical High-Risk').length,
      severeAnemia: dayScreens.filter((s) => Number(s.hb) < 7).length,
      preEclampsia: dayScreens.filter((s) => (s.bpSystolic || 0) >= 140 || (s.bpDiastolic || 0) >= 90).length,
      kitsDistributed,
      emergencyReferrals: dayTrips.filter((t) => t.tripType === '108 Referral').length,
      closingKitStock,
      avgHb: hbVals.length ? Number((hbVals.reduce((a, b) => a + b, 0) / hbVals.length).toFixed(2)) : 0,
    });
  }

  const hbAll = screenings.map((s) => Number(s.hb)).filter((n) => Number.isFinite(n) && n > 0);
  const totals = days.reduce(
    (acc, row) => {
      Object.keys(row).forEach((k) => {
        if (typeof row[k] === 'number' && k !== 'day' && k !== 'avgHb') acc[k] = (acc[k] || 0) + row[k];
      });
      return acc;
    },
    {}
  );
  totals.avgHb = hbAll.length ? Number((hbAll.reduce((a, b) => a + b, 0) / hbAll.length).toFixed(2)) : 0;
  totals.mothersScreened = screenings.length;
  totals.days = dim;

  res.json({ year, month, village, days, totals });
});

const villages = asyncHandler(async (req, res) => {
  if (req.user && req.user.role === 'ANM') {
    return res.json([req.user.village || 'Rampur']);
  }
  const Daily = require('../models/Beneficiary');
  const fromB = await Daily.distinct('village');
  const fromS = await DailyCampSheet.distinct('village');
  const set = Array.from(new Set([...fromB, ...fromS].filter(Boolean))).sort();
  res.json(set.length ? set : ['Rampur', 'Kheda', 'Moti Vav', 'Sankheda']);
});

module.exports = { monthlyReport, villages };
