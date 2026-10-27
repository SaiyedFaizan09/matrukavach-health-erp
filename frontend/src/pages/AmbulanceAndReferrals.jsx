import { useEffect, useState } from 'react';
import { ambulanceApi, beneficiaryApi } from '../api/services';
import SearchFilterBar from '../components/common/SearchFilterBar';
import { useAuth } from '../context/AuthContext';
import { dmy, errMsg, num, ymd } from '../utils/format';

const empty = {
  date: ymd(new Date()),
  vehicleNo: '',
  driverName: '',
  route: '',
  village: 'Rampur',
  referredMother: '',
  referredMotherName: '',
  referralReason: '',
  km: '',
  fuelLiters: '',
  tripType: 'MMU Camp',
  outcome: 'Completed',
};

export default function AmbulanceAndReferrals() {
  const { user } = useAuth();
  const canCreate = ['ANM', 'MEDICAL_OFFICER'].includes(user?.role);
  const canDelete = user?.role === 'MEDICAL_OFFICER';

  const [q, setQ] = useState('');
  const [dq, setDq] = useState('');
  const [filters, setFilters] = useState({ from: '', to: '', village: '' });
  const [tripType, setTripType] = useState('');
  const [data, setData] = useState({ rows: [], totals: { km: 0, fuel: 0, referrals: 0 } });
  const [mothers, setMothers] = useState([]);
  const [form, setForm] = useState(empty);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDq(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  const load = async () => {
    try {
      const res = await ambulanceApi.list({ q: dq, ...filters, tripType });
      setData(res);
    } catch (err) {
      setError(errMsg(err));
    }
  };

  useEffect(() => {
    load();
  }, [dq, filters.from, filters.to, filters.village, tripType]);

  useEffect(() => {
    beneficiaryApi.list({}).then(setMothers).catch(() => { });
  }, []);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const mileage = num(form.fuelLiters) > 0 ? (num(form.km) / num(form.fuelLiters)).toFixed(2) : '0.00';

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const mother = mothers.find((m) => m._id === form.referredMother);
      await ambulanceApi.create({
        ...form,
        referredMotherName: mother?.name || form.referredMotherName,
        km: Number(form.km),
        fuelLiters: Number(form.fuelLiters || 0),
        referredMother: form.referredMother || undefined,
      });
      setForm(empty);
      await load();
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this trip?')) return;
    await ambulanceApi.remove(id);
    load();
  };

  return (
    <div>
      <h1 className="mb-2 text-lg font-black">MMU & 108 Emergency Referral Logistics</h1>
      {error && <div className="mb-2 border border-red-800 bg-red-100 px-2 py-1 text-sm">{error}</div>}
      <SearchFilterBar
        q={q}
        onQ={setQ}
        searchPlaceholder="Search vehicle no., driver, village, mother…"
        filters={filters}
        onFilter={(k, v) => setFilters((f) => ({ ...f, [k]: v }))}
        extra={
          <label className="flex flex-col text-xs font-bold">
            Trip type
            <select value={tripType} onChange={(e) => setTripType(e.target.value)} className="mt-1 border border-zinc-700 px-2 py-1 text-sm font-normal">
              <option value="">All</option>
              <option>MMU Camp</option>
              <option>108 Referral</option>
              <option>Other</option>
            </select>
          </label>
        }
      />

      {canCreate && (
        <form onSubmit={submit} className="mb-3 grid grid-cols-2 gap-2 border border-zinc-900 bg-white p-2 text-sm md:grid-cols-4">
          <label className="font-semibold">
            Date
            <input required type="date" value={form.date} onChange={(e) => set('date', e.target.value)} className="mt-1 w-full border border-zinc-700 px-2 py-1 font-normal" />
          </label>
          <label className="font-semibold">
            V.NUM.
            <input required value={form.vehicleNo} onChange={(e) => set('vehicleNo', e.target.value)} className="mt-1 w-full border border-zinc-700 px-2 py-1 font-normal" />
          </label>
          <label className="font-semibold">
            Driver
            <input required value={form.driverName} onChange={(e) => set('driverName', e.target.value)} className="mt-1 w-full border border-zinc-700 px-2 py-1 font-normal" />
          </label>
          <label className="font-semibold">
            Trip type
            <select value={form.tripType} onChange={(e) => set('tripType', e.target.value)} className="mt-1 w-full border border-zinc-700 px-2 py-1 font-normal">
              <option>MMU Camp</option>
              <option>108 Referral</option>
              <option>Other</option>
            </select>
          </label>
          <label className="col-span-2 font-semibold">
            Route / Village covered
            <input required value={form.route} onChange={(e) => set('route', e.target.value)} className="mt-1 w-full border border-zinc-700 px-2 py-1 font-normal" />
          </label>
          <label className="font-semibold">
            Village
            <input value={form.village} onChange={(e) => set('village', e.target.value)} className="mt-1 w-full border border-zinc-700 px-2 py-1 font-normal" />
          </label>
          <label className="font-semibold">
            Referred mother
            <select value={form.referredMother} onChange={(e) => set('referredMother', e.target.value)} className="mt-1 w-full border border-zinc-700 px-2 py-1 font-normal">
              <option value="">Optional</option>
              {mothers.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.name}
                </option>
              ))}
            </select>
          </label>
          <label className="col-span-2 font-semibold">
            Referral reason
            <input value={form.referralReason} onChange={(e) => set('referralReason', e.target.value)} className="mt-1 w-full border border-zinc-700 px-2 py-1 font-normal" />
          </label>
          <label className="font-semibold">
            K.M.
            <input required type="number" value={form.km} onChange={(e) => set('km', e.target.value)} className="mt-1 w-full border border-zinc-700 px-2 py-1 font-normal" />
          </label>
          <label className="font-semibold">
            LETER
            <input type="number" step="0.1" value={form.fuelLiters} onChange={(e) => set('fuelLiters', e.target.value)} className="mt-1 w-full border border-zinc-700 px-2 py-1 font-normal" />
          </label>
          <label className="font-semibold">
            Mileage (auto)
            <input readOnly value={mileage} className="mt-1 w-full border border-zinc-400 bg-zinc-100 px-2 py-1 font-normal" />
          </label>
          <div className="col-span-2 flex items-end md:col-span-4">
            <button disabled={busy} className="border border-zinc-900 bg-yellow-300 px-3 py-1 font-bold disabled:opacity-50">
              {busy ? 'Saving…' : 'Log trip'}
            </button>
          </div>
        </form>
      )}

      <div className="mb-2 border border-zinc-900 bg-yellow-200 px-2 py-1 text-sm font-bold">
        Totals · KM {data.totals.km} · Fuel {data.totals.fuel} L · Emergency referrals {data.totals.referrals}
      </div>

      <table className="sheet-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>V.NUM.</th>
            <th>Driver</th>
            <th>Type</th>
            <th>Route</th>
            <th>Mother</th>
            <th>KM</th>
            <th>L</th>
            <th>Mileage</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {data.rows.map((r) => (
            <tr key={r._id}>
              <td>{dmy(r.date)}</td>
              <td>{r.vehicleNo}</td>
              <td>{r.driverName}</td>
              <td>{r.tripType}</td>
              <td>{r.route}</td>
              <td>{r.referredMotherName || r.referredMother?.name}</td>
              <td>{r.km}</td>
              <td>{r.fuelLiters}</td>
              <td>{r.mileage}</td>
              <td className="text-right">
                {canDelete && (
                  <button type="button" className="text-xs text-red-700 font-bold underline hover:text-red-900" onClick={() => remove(r._id)}>
                    Del
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
