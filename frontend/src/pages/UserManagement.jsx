import { useEffect, useState } from 'react';
import { userApi } from '../api/services';
import AddUserModal from '../components/common/AddUserModal';
import SearchFilterBar from '../components/common/SearchFilterBar';
import { useAuth } from '../context/AuthContext';
import { errMsg } from '../utils/format';

const ROLE_LABEL = {
  BLOCK_ADMIN: 'Block Admin',
  MEDICAL_OFFICER: 'PHC Medical Officer',
  ANM: 'ANM Nurse',
  ASHA: 'ASHA Worker',
  block_admin: 'Block Admin',
  phc_mo: 'PHC Medical Officer',
  anm: 'ANM Nurse',
  asha: 'ASHA Worker',
};

export default function UserManagement() {
  const { user } = useAuth();
  const isBlockAdmin = user?.role === 'BLOCK_ADMIN';

  const [rows, setRows] = useState([]);
  const [q, setQ] = useState('');
  const [dq, setDq] = useState('');
  const [filters, setFilters] = useState({ village: '' });
  const [role, setRole] = useState('');
  const [isActive, setIsActive] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDq(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  const load = async () => {
    setError('');
    try {
      setRows(await userApi.list({ q: dq, village: filters.village, role, isActive }));
    } catch (err) {
      setError(errMsg(err));
    }
  };

  useEffect(() => {
    load();
  }, [dq, filters.village, role, isActive]);

  const toggle = async (u) => {
    if (!isBlockAdmin) return;
    try {
      await userApi.update(u._id, { isActive: !u.isActive });
      load();
    } catch (err) {
      setError(errMsg(err));
    }
  };

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-black">System User Management</h1>
          <p className="text-xs text-zinc-600">
            {isBlockAdmin ? 'Full block-level user administration' : 'PHC Staff Directory (View-Only)'}
          </p>
        </div>
        {isBlockAdmin ? (
          <button type="button" onClick={() => setShowAdd(true)} className="border border-zinc-900 bg-yellow-300 px-3 py-1 text-sm font-bold shadow-sm">
            + Add New User
          </button>
        ) : (
          <span className="badge badge-normal">View Only</span>
        )}
      </div>
      {error && <div className="mb-2 border border-red-800 bg-red-100 px-2 py-1 text-sm font-bold text-red-900">{error}</div>}
      <SearchFilterBar
        q={q}
        onQ={setQ}
        searchPlaceholder="Search name, email, phone, village…"
        filters={filters}
        onFilter={(k, v) => setFilters((f) => ({ ...f, [k]: v }))}
        extra={
          <>
            <label className="flex flex-col text-xs font-bold">
              Role
              <select value={role} onChange={(e) => setRole(e.target.value)} className="mt-1 border border-zinc-700 px-2 py-1 text-sm font-normal">
                <option value="">All</option>
                <option value="BLOCK_ADMIN">Block Admin</option>
                <option value="MEDICAL_OFFICER">PHC Medical Officer</option>
                <option value="ANM">ANM Nurse</option>
                <option value="ASHA">ASHA Worker</option>
              </select>
            </label>
            <label className="flex flex-col text-xs font-bold">
              Status
              <select value={isActive} onChange={(e) => setIsActive(e.target.value)} className="mt-1 border border-zinc-700 px-2 py-1 text-sm font-normal">
                <option value="">All</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </label>
          </>
        }
      />

      <table className="sheet-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Role</th>
            <th>Village / PHC</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((u) => (
            <tr key={u._id}>
              <td className="font-semibold">{u.name}</td>
              <td className="font-mono text-xs">{u.email}</td>
              <td className="font-mono text-xs">{u.phone}</td>
              <td>
                <span className="font-bold">{ROLE_LABEL[u.role] || u.role}</span>
              </td>
              <td>
                {u.village || '—'} / {u.phc}
              </td>
              <td>
                <span className={u.isActive ? 'badge badge-normal' : 'badge badge-critical'}>
                  {u.isActive ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td>
                {isBlockAdmin ? (
                  <button type="button" className="text-xs font-bold underline" onClick={() => toggle(u)}>
                    {u.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                ) : (
                  <span className="text-[11px] text-zinc-400 italic">View only</span>
                )}
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={7} className="text-center py-6 text-zinc-500 italic">
                No system users found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      <AddUserModal open={showAdd} onClose={() => setShowAdd(false)} onCreated={() => load()} />
    </div>
  );
}
