import { LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

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

export default function Navbar() {
  const { user, logout } = useAuth();
  return (
    <header className="no-print flex h-12 items-center justify-between border-b-2 border-zinc-900 bg-white px-4">
      <div className="font-bold tracking-tight">
        MatruKavach <span className="font-normal text-zinc-600">| PHC {user?.phc || 'Rampur'}</span>
      </div>
      <div className="flex items-center gap-3 text-sm">
        <span>
          {user?.name} · {ROLE_LABEL[user?.role] || user?.role}
        </span>
        <button
          type="button"
          onClick={logout}
          className="inline-flex items-center gap-1 border border-zinc-900 bg-zinc-100 px-2 py-1 font-semibold"
        >
          <LogOut size={14} /> Logout
        </button>
      </div>
    </header>
  );
}
