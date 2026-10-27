import { useEffect, useState } from 'react';
import { userApi } from '../../api/services';
import { errMsg } from '../../utils/format';

const empty = {
  name: '',
  email: '',
  phone: '',
  password: '',
  role: 'ASHA',
  village: 'Rampur',
  phc: 'PHC Rampur',
};

export default function AddUserModal({ open, onClose, onCreated }) {
  const [form, setForm] = useState(empty);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(empty);
      setError('');
    }
  }, [open]);

  if (!open) return null;
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const created = await userApi.create(form);
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
      <form onSubmit={submit} className="w-full max-w-lg border-2 border-zinc-900 bg-white p-4 shadow-[4px_4px_0px_rgba(0,0,0,1)]">
        <h2 className="mb-3 border-b border-zinc-900 pb-2 text-lg font-bold">Add System User</h2>
        {error && <div className="mb-2 border border-red-800 bg-red-100 px-2 py-1 text-sm font-bold text-red-900">{error}</div>}
        <div className="grid grid-cols-1 gap-2 text-sm">
          <label className="font-semibold">
            Full Name *
            <input required value={form.name} onChange={(e) => set('name', e.target.value)} className="mt-1 w-full border border-zinc-700 px-2 py-1 font-normal" />
          </label>
          <label className="font-semibold">
            Email / Username *
            <input required type="email" value={form.email} onChange={(e) => set('email', e.target.value)} className="mt-1 w-full border border-zinc-700 px-2 py-1 font-normal" />
          </label>
          <label className="font-semibold">
            Phone *
            <input required value={form.phone} onChange={(e) => set('phone', e.target.value)} className="mt-1 w-full border border-zinc-700 px-2 py-1 font-normal" />
          </label>
          <label className="font-semibold">
            Password *
            <input required minLength={6} type="password" value={form.password} onChange={(e) => set('password', e.target.value)} className="mt-1 w-full border border-zinc-700 px-2 py-1 font-normal" />
          </label>
          <label className="font-semibold">
            Role *
            <select value={form.role} onChange={(e) => set('role', e.target.value)} className="mt-1 w-full border border-zinc-700 px-2 py-1 font-normal">
              <option value="BLOCK_ADMIN">Block Admin</option>
              <option value="MEDICAL_OFFICER">PHC Medical Officer</option>
              <option value="ANM">ANM Nurse</option>
              <option value="ASHA">ASHA Worker</option>
            </select>
          </label>
          <label className="font-semibold">
            Assigned Village / PHC
            <input value={form.village} onChange={(e) => set('village', e.target.value)} className="mt-1 w-full border border-zinc-700 px-2 py-1 font-normal" />
          </label>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="border border-zinc-900 px-3 py-1">
            Cancel
          </button>
          <button disabled={busy} type="submit" className="border border-zinc-900 bg-yellow-300 px-3 py-1 font-bold disabled:opacity-50">
            {busy ? 'Saving…' : 'Create User'}
          </button>
        </div>
      </form>
    </div>
  );
}
