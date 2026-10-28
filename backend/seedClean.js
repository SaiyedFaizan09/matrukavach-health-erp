const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const User = require('./models/User');
const Beneficiary = require('./models/Beneficiary');
const DailyCampSheet = require('./models/DailyCampSheet');
const ScreeningRecord = require('./models/ScreeningRecord');
const AmbulanceLog = require('./models/AmbulanceLog');

dotenv.config({ path: path.join(__dirname, '.env') });

const DEMO_LOGIN_EMAILS = [
  'admin@block.gov.in',
  'meena@phc.gov.in',
  'kavita@phc.gov.in',
  'rekha@phc.gov.in',
  'leela@phc.gov.in',
  'sita@phc.gov.in',
];

async function cleanSeedData() {
  await connectDB();

  const [screeningResult, ambulanceResult, campSheetResult, beneficiaryResult, userResult] =
    await Promise.all([
      ScreeningRecord.deleteMany({}),
      AmbulanceLog.deleteMany({}),
      DailyCampSheet.deleteMany({}),
      Beneficiary.deleteMany({}),
      User.deleteMany({ email: { $nin: DEMO_LOGIN_EMAILS } }),
    ]);

  console.log('Demo data cleaned.');
  console.log(`  Screening records removed: ${screeningResult.deletedCount}`);
  console.log(`  Ambulance logs removed: ${ambulanceResult.deletedCount}`);
  console.log(`  Daily camp sheets removed: ${campSheetResult.deletedCount}`);
  console.log(`  Beneficiaries removed: ${beneficiaryResult.deletedCount}`);
  console.log(`  Non-demo users removed: ${userResult.deletedCount}`);
  console.log('Demo login users were preserved.');
}

cleanSeedData()
  .catch((err) => {
    console.error('Failed to clean demo data:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
