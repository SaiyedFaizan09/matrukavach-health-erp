import {
  Ambulance,
  BarChart3,
  Stethoscope,
  UserCog,
  Users,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const links = [
  {
    to: '/',
    label: '1. Daily Camp Workspace',
    desc: 'Triage, Stock & Daily Screenings',
    icon: Stethoscope,
    roles: ['ANM', 'MEDICAL_OFFICER', 'BLOCK_ADMIN'],
  },
  {
    to: '/beneficiaries',
    label: '2. Mother Directory / Risk',
    desc: 'Beneficiary Ledger & Clinical Tracking',
    icon: Users,
    roles: ['ASHA', 'ANM', 'MEDICAL_OFFICER', 'BLOCK_ADMIN'],
  },
  {
    to: '/ambulance',
    label: '3. MMU / 108 Referrals',
    desc: 'Emergency MMU & Critical Transit',
    icon: Ambulance,
    roles: ['ASHA', 'ANM', 'MEDICAL_OFFICER', 'BLOCK_ADMIN'],
  },
  {
    to: '/reports',
    label: '4. Monthly Consolidation',
    desc: 'HMIS & Monthly PHC Reports',
    icon: BarChart3,
    roles: ['ANM', 'MEDICAL_OFFICER', 'BLOCK_ADMIN'],
  },
  {
    to: '/users',
    label: '5. User Management',
    desc: 'Roles, Staff & ANM/ASHA Access',
    icon: UserCog,
    roles: ['MEDICAL_OFFICER', 'BLOCK_ADMIN'],
  },
];

export default function Sidebar() {
  const { user } = useAuth();

  return (
    <aside className="no-print w-14 shrink-0 border-r-2 border-zinc-900 bg-zinc-200 flex flex-col justify-between">
      <div>
        <div
          className="border-b-2 border-zinc-900 h-12 flex items-center justify-center font-black text-sm tracking-wider uppercase bg-zinc-300 select-none cursor-default"
          title="MatruKavach - Rural Maternal ERP"
        >
          MK
        </div>
        <nav className="flex flex-col">
          {links
            .filter((l) => !l.roles || l.roles.includes(user?.role))
            .map((l) => {
              const Icon = l.icon;
              return (
                <NavLink
                  key={l.to}
                  to={l.to}
                  end={l.to === '/'}
                  aria-label={l.label}
                  className={({ isActive }) =>
                    `group relative flex h-12 w-full items-center justify-center border-b border-zinc-400 outline-none transition-none ${isActive
                      ? 'bg-yellow-300 font-bold text-zinc-950 border-r-4 border-r-zinc-950'
                      : 'bg-transparent text-zinc-700 hover:bg-zinc-300 hover:text-zinc-950 focus-visible:bg-zinc-300'
                    }`
                  }
                >
                  <Icon size={20} strokeWidth={2.2} />

                  {/* Clean high-contrast tooltip on hover / focus */}
                  <div
                    role="tooltip"
                    className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-2 z-50 hidden group-hover:flex group-focus-visible:flex flex-col whitespace-nowrap bg-zinc-950 text-white border-2 border-zinc-900 px-3 py-1.5 shadow-[2px_2px_0px_rgba(0,0,0,1)] text-xs text-left"
                  >
                    <div className="absolute right-full top-1/2 -translate-y-1/2 border-[5px] border-transparent border-r-zinc-950" />
                    <span className="font-bold text-yellow-300">{l.label}</span>
                    <span className="text-[11px] text-zinc-300 font-normal">{l.desc}</span>
                  </div>
                </NavLink>
              );
            })}
        </nav>
      </div>

      <div className="border-t border-zinc-400 p-2 text-center text-[10px] font-bold text-zinc-500 uppercase tracking-tighter">
        v1.0
      </div>
    </aside>
  );
}

