const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const User = require('./models/User');
const Beneficiary = require('./models/Beneficiary');
const DailyCampSheet = require('./models/DailyCampSheet');
const ScreeningRecord = require('./models/ScreeningRecord');
const AmbulanceLog = require('./models/AmbulanceLog');
const { startOfDay, addDays } = require('./utils/dateHelpers');
const { classifyAnemia } = require('./utils/clinicalRiskEngine');

dotenv.config({ path: path.join(__dirname, '.env') });

const DEMO_PASSWORD = 'Password@123';

function kitLine(oldStock, inflows, damaged = 0) {
  return {
    oldStock,
    inflows: inflows.concat(Array.from({ length: Math.max(0, 3 - inflows.length) }, () => ({ batchNo: '', supplier: '', quantity: 0 }))),
    dispatched: 0,
    damaged,
    closing: 0,
  };
}

async function seed() {
  await connectDB();
  await Promise.all([
    User.deleteMany({}),
    Beneficiary.deleteMany({}),
    DailyCampSheet.deleteMany({}),
    ScreeningRecord.deleteMany({}),
    AmbulanceLog.deleteMany({}),
  ]);

  const admin = await User.create({
    name: 'Block Admin Ramesh Desai',
    email: 'admin@block.gov.in',
    phone: '9876500001',
    password: DEMO_PASSWORD,
    role: 'BLOCK_ADMIN',
    village: 'Block HQ',
    phc: 'Block Health Office',
  });
  const doctor = await User.create({
    name: 'Dr. Meena Patel',
    email: 'meena@phc.gov.in',
    phone: '9876500002',
    password: DEMO_PASSWORD,
    role: 'MEDICAL_OFFICER',
    village: 'Rampur',
    phc: 'PHC Rampur',
  });
  const anm = await User.create({
    name: 'ANM Kavita Solanki',
    email: 'kavita@phc.gov.in',
    phone: '9876500003',
    password: DEMO_PASSWORD,
    role: 'ANM',
    village: 'Rampur',
    phc: 'PHC Rampur',
  });
  const asha1 = await User.create({
    name: 'ASHA Rekha Rathod',
    email: 'rekha@phc.gov.in',
    phone: '9876500101',
    password: DEMO_PASSWORD,
    role: 'ASHA',
    village: 'Rampur',
    phc: 'PHC Rampur',
  });
  const asha2 = await User.create({
    name: 'ASHA Leela Vasava',
    email: 'leela@phc.gov.in',
    phone: '9876500102',
    password: DEMO_PASSWORD,
    role: 'ASHA',
    village: 'Kheda',
    phc: 'PHC Rampur',
  });
  const asha3 = await User.create({
    name: 'ASHA Sita Bariya',
    email: 'sita@phc.gov.in',
    phone: '9876500103',
    password: DEMO_PASSWORD,
    role: 'ASHA',
    village: 'Moti Vav',
    phc: 'PHC Rampur',
  });

  const today = startOfDay(new Date());
  const yesterday = startOfDay(addDays(today, -1));

  const mothers = [
    { name: 'Kalpana Rathod', rchId: 'RCH-GJ-1001', phone: '9825011001', village: 'Rampur', asha: asha1, lmp: '2026-02-10', hb: 11.2, bg: 'O+', risk: 'Normal' },
    { name: 'Bhavna Vasava', rchId: 'RCH-GJ-1002', phone: '9825011002', village: 'Kheda', asha: asha2, lmp: '2026-01-26', hb: 6.4, bg: 'B+', risk: 'Critical High-Risk' },
    { name: 'Narmada Bariya', rchId: 'RCH-GJ-1003', phone: '9825011003', village: 'Moti Vav', asha: asha3, lmp: '2026-03-01', hb: 8.1, bg: 'A+', risk: 'Moderate' },
    { name: 'Jignasha Patel', rchId: 'RCH-GJ-1004', phone: '9825011004', village: 'Rampur', asha: asha1, lmp: '2026-04-12', hb: 10.5, bg: 'AB+', risk: 'Normal' },
    { name: 'Hansaben Damor', rchId: 'RCH-GJ-1005', phone: '9825011005', village: 'Sankheda', asha: asha2, lmp: '2026-01-20', hb: 6.8, bg: 'O-', risk: 'Critical High-Risk' },
    { name: 'Ramilaben Chauhan', rchId: 'RCH-GJ-1006', phone: '9825011006', village: 'Kheda', asha: asha2, lmp: '2026-05-05', hb: 9.2, bg: 'B-', risk: 'Moderate' },
    { name: 'Savita Tadvi', rchId: 'RCH-GJ-1007', phone: '9825011007', village: 'Rampur', asha: asha1, lmp: '2026-06-18', hb: 12.0, bg: 'A-', risk: 'Normal' },
    { name: 'Geeta Rathwa', rchId: 'RCH-GJ-1008', phone: '9825011008', village: 'Moti Vav', asha: asha3, lmp: '2026-02-02', hb: 7.4, bg: 'O+', risk: 'Moderate' },
    { name: 'Pooja Gohil', rchId: 'RCH-GJ-1009', phone: '9825011009', village: 'Rampur', asha: asha1, lmp: '2026-07-01', hb: 11.8, bg: 'B+', risk: 'Normal' },
    { name: 'Meenaben Parmar', rchId: 'RCH-GJ-1010', phone: '9825011010', village: 'Kheda', asha: asha2, lmp: '2026-01-28', hb: 6.2, bg: 'A+', risk: 'Critical High-Risk' },
    { name: 'Kiranben Solanki', rchId: 'RCH-GJ-1011', phone: '9825011011', village: 'Sankheda', asha: asha3, lmp: '2026-03-20', hb: 8.8, bg: 'O+', risk: 'Moderate' },
    { name: 'Anitaben Patel', rchId: 'RCH-GJ-1012', phone: '9825011012', village: 'Rampur', asha: asha1, lmp: '2026-08-08', hb: 12.4, bg: 'AB-', risk: 'Normal' },
    { name: 'Dakshaben Vasava', rchId: 'RCH-GJ-1013', phone: '9825011013', village: 'Moti Vav', asha: asha3, lmp: '2026-04-28', hb: 9.7, bg: 'B+', risk: 'Moderate' },
    { name: 'Shakuntala Rathod', rchId: 'RCH-GJ-1014', phone: '9825011014', village: 'Rampur', asha: asha1, lmp: '2026-02-05', hb: 5.9, bg: 'O+', risk: 'Critical High-Risk' },
    { name: 'Urmila Bariya', rchId: 'RCH-GJ-1015', phone: '9825011015', village: 'Kheda', asha: asha2, lmp: '2026-09-01', hb: 11.0, bg: 'A+', risk: 'Normal' },
  ];

  const createdMothers = [];
  for (const m of mothers) {
    const row = await Beneficiary.create({
      name: m.name,
      rchId: m.rchId,
      abhaId: `ABHA-${m.rchId.slice(-4)}`,
      phone: m.phone,
      village: m.village,
      assignedAsha: m.asha._id,
      lmpDate: m.lmp,
      baselineHb: m.hb,
      bloodGroup: m.bg,
      currentRiskLevel: m.risk,
      anemiaStatus: classifyAnemia(m.hb),
      notes: m.risk === 'Critical High-Risk' ? 'Medical Officer Note: High-risk triage. Monitor Hb & BP weekly. 108 referral standby.' : '',
      pendingSupplements: m.risk === 'Normal' ? '' : 'IFA + Calcium pending review',
      nextVisitDate: addDays(today, m.risk === 'Critical High-Risk' ? -2 : 10),
    });
    createdMothers.push(row);
  }

  const ySheet = await DailyCampSheet.create({
    date: yesterday,
    village: 'Rampur',
    stock: {
      ifa: kitLine(180, [{ batchNo: 'IFA-D26', supplier: 'District Store Vadodara', quantity: 40 }]),
      calcium: kitLine(120, [{ batchNo: 'CA-D11', supplier: 'District Store Vadodara', quantity: 20 }]),
      poshan: kitLine(60, [{ batchNo: 'POS-09', supplier: 'ICDS Block Store', quantity: 15 }]),
      hbStrips: kitLine(90, [{ batchNo: 'HB-44', supplier: 'NHM Diagnostics', quantity: 25 }]),
    },
  });

  const tSheet = await DailyCampSheet.create({
    date: today,
    village: 'Rampur',
    stock: {
      ifa: kitLine(ySheet.stock.ifa.closing, [{ batchNo: 'IFA-D27', supplier: 'District Store Vadodara', quantity: 50 }]),
      calcium: kitLine(ySheet.stock.calcium.closing, [{ batchNo: 'CA-D12', supplier: 'District Store Vadodara', quantity: 30 }]),
      poshan: kitLine(ySheet.stock.poshan.closing, [{ batchNo: 'POS-10', supplier: 'ICDS Block Store', quantity: 20 }]),
      hbStrips: kitLine(ySheet.stock.hbStrips.closing, [{ batchNo: 'HB-45', supplier: 'NHM Diagnostics', quantity: 40 }]),
    },
  });

  const screeningSeeds = [
    { mother: 0, week: 37, hb: 11.2, sys: 118, dia: 76, sugar: 96, wt: 58, ifa: 1, poshan: 1, calcium: 1 },
    { mother: 1, week: 39, hb: 6.4, sys: 148, dia: 96, sugar: 152, wt: 64, ifa: 2, poshan: 1, calcium: 1 },
    { mother: 3, week: 28, hb: 10.5, sys: 122, dia: 80, sugar: 102, wt: 61, ifa: 1, poshan: 1, calcium: 0 },
    { mother: 6, week: 18, hb: 12.0, sys: 110, dia: 70, sugar: 88, wt: 54, ifa: 1, poshan: 0, calcium: 1 },
    { mother: 9, week: 39, hb: 6.2, sys: 142, dia: 92, sugar: 138, wt: 67, ifa: 2, poshan: 1, calcium: 1 },
    { mother: 13, week: 38, hb: 5.9, sys: 136, dia: 88, sugar: 118, wt: 62, ifa: 2, poshan: 1, calcium: 1 },
  ];

  let token = 1;
  for (const s of screeningSeeds) {
    const rec = await ScreeningRecord.create({
      campSheet: tSheet._id,
      campDate: today,
      village: 'Rampur',
      tokenNo: token,
      beneficiary: createdMothers[s.mother]._id,
      gestWeek: s.week,
      hb: s.hb,
      bpSystolic: s.sys,
      bpDiastolic: s.dia,
      bloodSugar: s.sugar,
      weightKg: s.wt,
      kitsGiven: { ifa: s.ifa, calcium: s.calcium, poshan: s.poshan, hbStrips: 1 },
      createdBy: anm._id,
    });
    const mother = createdMothers[s.mother];
    mother.currentRiskLevel = rec.riskStatus;
    mother.anemiaStatus = rec.anemiaStatus;
    mother.lastVisitDate = today;
    mother.lastGestWeek = s.week;
    mother.nextVisitDate = rec.nextVisitDate;
    await mother.save();
    token += 1;
  }

  const rows = await ScreeningRecord.find({ campSheet: tSheet._id });
  tSheet.stock.ifa.dispatched = rows.reduce((a, r) => a + r.kitsGiven.ifa, 0);
  tSheet.stock.calcium.dispatched = rows.reduce((a, r) => a + r.kitsGiven.calcium, 0);
  tSheet.stock.poshan.dispatched = rows.reduce((a, r) => a + r.kitsGiven.poshan, 0);
  tSheet.stock.hbStrips.dispatched = rows.reduce((a, r) => a + r.kitsGiven.hbStrips, 0);
  tSheet.recalculate();
  await tSheet.save();

  await AmbulanceLog.create([
    {
      date: today,
      vehicleNo: 'GJ-06-G-1081',
      driverName: 'Raju Bariya',
      route: 'Rampur → District Civil Hospital Vadodara',
      village: 'Rampur',
      referredMother: createdMothers[1]._id,
      referredMotherName: createdMothers[1].name,
      referralReason: 'Severe anemia + high BP (pre-eclampsia risk)',
      km: 42,
      fuelLiters: 5.5,
      tripType: '108 Referral',
      outcome: 'Admitted',
      createdBy: doctor._id,
    },
    {
      date: today,
      vehicleNo: 'GJ-06-MMU-12',
      driverName: 'Suresh Rathod',
      route: 'Rampur – Kheda – Moti Vav outreach',
      village: 'Rampur',
      km: 68,
      fuelLiters: 8,
      tripType: 'MMU Camp',
      outcome: 'Camp completed',
      createdBy: anm._id,
    },
    {
      date: yesterday,
      vehicleNo: 'GJ-06-G-1081',
      driverName: 'Raju Bariya',
      route: 'Moti Vav → PHC Rampur',
      village: 'Moti Vav',
      referredMother: createdMothers[13]._id,
      referredMotherName: createdMothers[13].name,
      referralReason: 'Hb 5.9 severe anemia',
      km: 18,
      fuelLiters: 2.2,
      tripType: '108 Referral',
      outcome: 'Stabilized at PHC',
      createdBy: doctor._id,
    },
  ]);

  console.log('Seed complete.');
  console.log('Demo logins (password: Password@123)');
  console.log('  admin@block.gov.in   Block Admin');
  console.log('  meena@phc.gov.in     PHC Medical Officer');
  console.log('  kavita@phc.gov.in    ANM Nurse');
  console.log('  rekha@phc.gov.in     ASHA Worker');
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
