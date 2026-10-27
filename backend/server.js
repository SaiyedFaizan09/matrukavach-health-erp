const path = require('path');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN || true,
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'MatruKavach API' });
});

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/beneficiaries', require('./routes/beneficiaryRoutes'));
app.use('/api/camps', require('./routes/dailyCampRoutes'));
app.use('/api/ambulance', require('./routes/ambulanceRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

connectDB()
  .then(async () => {
    try {
      const User = require('./models/User');
      await Promise.all([
        User.updateMany({ role: { $in: ['block_admin', 'BLOCK_ADMIN'] } }, { $set: { role: 'BLOCK_ADMIN' } }),
        User.updateMany({ role: { $in: ['phc_mo', 'MEDICAL_OFFICER'] } }, { $set: { role: 'MEDICAL_OFFICER' } }),
        User.updateMany({ role: { $in: ['anm', 'ANM'] } }, { $set: { role: 'ANM' } }),
        User.updateMany({ role: { $in: ['asha', 'ASHA'] } }, { $set: { role: 'ASHA' } }),
      ]);
    } catch (e) {
      console.warn('Role migration note:', e.message);
    }
    app.listen(PORT, () => {
      console.log(`MatruKavach API running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  });
