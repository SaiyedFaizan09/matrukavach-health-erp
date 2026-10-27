import { useEffect, useState } from 'react';
import { beneficiaryApi, userApi } from '../../api/services';
import { errMsg, ymd } from '../../utils/format';

const empty = {
  name: '',
  rchId: '',
  abhaId: '',
  phone: '',
  village: 'Rampur',
  assignedAsha: '',
  lmpDate: '',
  baselineHb: '',
  bloodGroup: 'Unknown',
  currentRiskLevel: 'Normal',
  pendingSupplements: '',
};

export default function AddBeneficiaryModal({ open, onClose, onCreated, defaults = {} }) {
  const [form, setForm] = useState({ ...empty, ...defaults });
  const [ashas, setAshas] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm({ ...empty, ...defaults });
    setError('');
    userApi.list({ role: 'ASHA', isActive: 'true' }).then(setAshas).catch(() => setAshas([]));
  }, [open]);

  if (!open) return null;

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const edd = form.lmpDate
    ? ymd(new Date(new Date(form.lmpDate).getTime() + 280 * 24 * 3600 * 1000))
    : '';

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const created = await beneficiaryApi.create({
        ...form,
        assignedAsha: form.assignedAsha || undefined,
        baselineHb: form.baselineHb === '' ? null : Number(form.baselineHb),
      });
      onCreated?.(created);
      onClose();
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-6">
      <form onSubmit={submit} className="w-full max-w-2xl border-2 border-zinc-900 bg-white p-4">
        <h2 className="mb-3 border-b border-zinc-900 pb-2 text-lg font-bold">Register New Mother / Beneficiary</h2>
        {error && <div className="mb-2 border border-red-800 bg-red-100 px-2 py-1 text-sm">{error}</div>}
        <div className="grid grid-cols-2 gap-2 text-sm">
          <label className="font-semibold">
            Mother Name *
            <input required value={form.name} onChange={(e) => set('name', e.target.value)} className="mt-1 w-full border border-zinc-700 px-2 py-1 font-normal" />
          </label>
          <label className="font-semibold">
            RCH / ABHA ID *
            <input required value={form.rchId} onChange={(e) => set('rchId', e.target.value)} className="mt-1 w-full border border-zinc-700 px-2 py-1 font-normal" />
          </label>
          <label className="font-semibold">
            ABHA (optional)
            <input value={form.abhaId} onChange={(e) => set('abhaId', e.target.value)} className="mt-1 w-full border border-zinc-700 px-2 py-1 font-normal" />
          </label>
          <label className="font-semibold">
            10-digit Family Phone *
            <input required pattern="\d{10}" value={form.phone} onChange={(e) => set('phone', e.target.value)} className="mt-1 w-full border border-zinc-700 px-2 py-1 font-normal" />
          </label>
          <label className="font-semibold">
            Village / Ward *
            <input required value={form.village} onChange={(e) => set('village', e.target.value)} className="mt-1 w-full border border-zinc-700 px-2 py-1 font-normal" />
          </label>
          <label className="font-semibold">
            Assigned ASHA
            <select value={form.assignedAsha} onChange={(e) => set('assignedAsha', e.target.value)} className="mt-1 w-full border border-zinc-700 px-2 py-1 font-normal">
              <option value="">— Select —</option>
              {ashas.map((a) => (
                <option key={a._id} value={a._id}>
                  {a.name} ({a.village})
                </option>
              ))}
            </select>
          </label>
          <label className="font-semibold">
            LMP Date *
            <input required type="date" value={form.lmpDate} onChange={(e) => set('lmpDate', e.target.value)} className="mt-1 w-full border border-zinc-700 px-2 py-1 font-normal" />
          </label>
          <label className="font-semibold">
            EDD (auto)
            <input readOnly value={edd} className="mt-1 w-full border border-zinc-400 bg-zinc-100 px-2 py-1 font-normal" />
          </label>
          <label className="font-semibold">
            Baseline Hb
            <input type="number" step="0.1" value={form.baselineHb} onChange={(e) => set('baselineHb', e.target.value)} className="mt-1 w-full border border-zinc-700 px-2 py-1 font-normal" />
          </label>
          <label className="font-semibold">
            Blood Group
            <select value={form.bloodGroup} onChange={(e) => set('bloodGroup', e.target.value)} className="mt-1 w-full border border-zinc-700 px-2 py-1 font-normal">
              {['Unknown', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((g) => (
                <option key={g}>{g}</option>
              ))}
            </select>
          </label>
          <label className="font-semibold">
            Current Risk Level
            <select value={form.currentRiskLevel} onChange={(e) => set('currentRiskLevel', e.target.value)} className="mt-1 w-full border border-zinc-700 px-2 py-1 font-normal">
              <option>Normal</option>
              <option>Moderate</option>
              <option value="Critical High-Risk">Critical High-Risk</option>
            </select>
          </label>
          <label className="col-span-2 font-semibold">
            Pending Supplements
            <input value={form.pendingSupplements} onChange={(e) => set('pendingSupplements', e.target.value)} className="mt-1 w-full border border-zinc-700 px-2 py-1 font-normal" />
          </label>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="border border-zinc-900 px-3 py-1">
            Cancel
          </button>
          <button disabled={busy} type="submit" className="border border-zinc-900 bg-yellow-300 px-3 py-1 font-bold disabled:opacity-50">
            {busy ? 'Saving…' : 'Save Mother'}
          </button>
        </div>
      </form>
    </div>
  );
}
