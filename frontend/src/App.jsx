import React, { useEffect, useState } from 'react';
import { Link, Navigate, Route, Routes } from 'react-router-dom';
import { subscribeLoading } from './api/axiosInstance';
import { LoadingOverlay } from './components/common/LoadingSpinner';
import Navbar from './components/common/Navbar';
import Sidebar from './components/common/Sidebar';
import { useAuth } from './context/AuthContext';
import AmbulanceAndReferrals from './pages/AmbulanceAndReferrals';
import BeneficiaryAndRiskLedger from './pages/BeneficiaryAndRiskLedger';
import DailyCampWorkspace from './pages/DailyCampWorkspace';
import Login from './pages/Login';
import MonthlyHealthReport from './pages/MonthlyHealthReport';
import UserManagement from './pages/UserManagement';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('MatruKavach Uncaught Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-zinc-100 p-6">
          <div className="max-w-md border-2 border-zinc-900 bg-white p-6 shadow-[4px_4px_0px_rgba(0,0,0,1)]">
            <div className="mb-2 inline-block border border-red-800 bg-red-100 px-2 py-0.5 text-xs font-bold text-red-900 uppercase">
              Application Error
            </div>
            <h1 className="text-lg font-black text-zinc-900 mb-2">Something went wrong</h1>
            <p className="text-xs text-zinc-700 mb-4 font-mono bg-zinc-50 p-2 border border-zinc-300 overflow-auto max-h-32">
              {this.state.error?.message || 'Unexpected application runtime exception'}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="border-2 border-zinc-900 bg-yellow-300 px-3 py-1.5 text-xs font-bold text-zinc-900 hover:bg-yellow-400"
              >
                Reload Page
              </button>
              <button
                type="button"
                onClick={() => {
                  localStorage.clear();
                  window.location.href = '/login';
                }}
                className="border border-zinc-800 bg-zinc-100 px-3 py-1.5 text-xs font-bold text-zinc-700 hover:bg-zinc-200"
              >
                Reset Session & Sign In
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function UnauthorizedView({ role }) {
  const targetPath = role === 'ASHA' ? '/beneficiaries' : '/';
  const targetLabel = role === 'ASHA' ? 'Mother Directory & Risk Ledger' : 'Daily Camp Workspace';

  return (
    <div className="flex h-[70vh] flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md border-2 border-zinc-900 bg-white p-6 shadow-[4px_4px_0px_rgba(0,0,0,1)]">
        <div className="mb-2 inline-block border border-red-800 bg-red-100 px-2.5 py-0.5 text-xs font-black uppercase text-red-900">
          Access Restricted (403)
        </div>
        <h2 className="mb-2 text-lg font-black text-zinc-900">Module Access Prohibited</h2>
        <p className="mb-4 text-xs text-zinc-700 leading-relaxed">
          Your current user role <span className="font-mono font-bold bg-zinc-100 px-1.5 py-0.5 border border-zinc-400">[{role || 'UNKNOWN'}]</span> does not have authorization to view or edit this operational module.
        </p>
        <Link
          to={targetPath}
          className="inline-block border-2 border-zinc-900 bg-yellow-300 px-4 py-2 text-xs font-black uppercase tracking-wider text-zinc-950 hover:bg-yellow-400"
        >
          Return to {targetLabel}
        </Link>
      </div>
    </div>
  );
}

function Protected({ children, roles }) {
  const { user, ready } = useAuth();
  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center font-mono text-xs font-bold text-zinc-600">
        Loading MatruKavach Session…
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) {
    return (
      <Shell>
        <UnauthorizedView role={user.role} />
      </Shell>
    );
  }
  return children;
}

function Shell({ children }) {
  return (
    <div className="flex min-h-screen bg-zinc-100 text-zinc-900">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar />
        <main className="flex-1 p-3">{children}</main>
      </div>
    </div>
  );
}

function DefaultRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === 'ASHA' ? '/beneficiaries' : '/'} replace />;
}

export default function App() {
  const [loading, setLoading] = useState(false);

  useEffect(() => subscribeLoading((on) => setLoading(on)), []);

  return (
    <ErrorBoundary>
      <LoadingOverlay show={loading} />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <Protected roles={['ANM', 'MEDICAL_OFFICER', 'BLOCK_ADMIN']}>
              <Shell>
                <DailyCampWorkspace />
              </Shell>
            </Protected>
          }
        />
        <Route
          path="/beneficiaries"
          element={
            <Protected roles={['ASHA', 'ANM', 'MEDICAL_OFFICER', 'BLOCK_ADMIN']}>
              <Shell>
                <BeneficiaryAndRiskLedger />
              </Shell>
            </Protected>
          }
        />
        <Route
          path="/ambulance"
          element={
            <Protected roles={['ASHA', 'ANM', 'MEDICAL_OFFICER', 'BLOCK_ADMIN']}>
              <Shell>
                <AmbulanceAndReferrals />
              </Shell>
            </Protected>
          }
        />
        <Route
          path="/reports"
          element={
            <Protected roles={['ANM', 'MEDICAL_OFFICER', 'BLOCK_ADMIN']}>
              <Shell>
                <MonthlyHealthReport />
              </Shell>
            </Protected>
          }
        />
        <Route
          path="/users"
          element={
            <Protected roles={['MEDICAL_OFFICER', 'BLOCK_ADMIN']}>
              <Shell>
                <UserManagement />
              </Shell>
            </Protected>
          }
        />
        <Route path="*" element={<DefaultRedirect />} />
      </Routes>
    </ErrorBoundary>
  );
}
