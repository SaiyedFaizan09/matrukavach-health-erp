import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { authApi } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { errMsg } from '../utils/format';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function Login() {
  const { user, login } = useAuth();
  const [email, setEmail] = useState('meena@phc.gov.in');
  const [password, setPassword] = useState('Password@123');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) {
    return <Navigate to={user.role === 'ASHA' ? '/beneficiaries' : '/'} replace />;
  }

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const data = await authApi.login({ email, password });
      login(data.token, data.user);
    } catch (err) {
      setError(errMsg(err, 'Login failed'));
    } finally {
      setBusy(false);
    }
  };

  const setDemo = (em) => {
    setEmail(em);
    setPassword('Password@123');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-200 p-4">
      <form onSubmit={submit} className="w-full max-w-md border-2 border-zinc-900 bg-white p-6 shadow-[4px_4px_0px_rgba(0,0,0,1)]">
        <h1 className="text-2xl font-black">MatruKavach</h1>
        <p className="mb-4 text-sm text-zinc-700">Rural Maternal Healthcare · PHC Camp ERP</p>
        {error && <div className="mb-3 border border-red-800 bg-red-100 px-2 py-1 text-sm font-bold text-red-900">{error}</div>}
        <label className="block text-sm font-bold">
          Email
          <input
            className="mt-1 mb-3 w-full border border-zinc-800 px-2 py-2 font-mono text-sm"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
          />
        </label>
        <label className="block text-sm font-bold">
          Password
          <input
            type="password"
            className="mt-1 mb-4 w-full border border-zinc-800 px-2 py-2 font-mono text-sm"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </label>
        <button
          disabled={busy}
          className="w-full border-2 border-zinc-900 bg-yellow-300 py-2 font-bold uppercase tracking-wider text-zinc-950 hover:bg-yellow-400 disabled:opacity-50"
        >
          {busy ? <span className="inline-flex justify-center"><LoadingSpinner label="Signing in" /></span> : 'Enter PHC Console'}
        </button>

        <div className="mt-4 border-t border-zinc-300 pt-3 text-xs text-zinc-700">
          <div className="font-bold text-zinc-900 mb-1">Quick Select Demo Account:</div>
          <div className="grid grid-cols-2 gap-1.5 font-medium">
            <button
              type="button"
              onClick={() => setDemo('admin@block.gov.in')}
              className="border border-zinc-700 bg-zinc-100 px-2 py-1 text-left text-[11px] hover:bg-yellow-200"
            >
              👑 Block Admin
            </button>
            <button
              type="button"
              onClick={() => setDemo('meena@phc.gov.in')}
              className="border border-zinc-700 bg-zinc-100 px-2 py-1 text-left text-[11px] hover:bg-yellow-200"
            >
              🩺 Medical Officer
            </button>
            <button
              type="button"
              onClick={() => setDemo('kavita@phc.gov.in')}
              className="border border-zinc-700 bg-zinc-100 px-2 py-1 text-left text-[11px] hover:bg-yellow-200"
            >
              💉 ANM Nurse
            </button>
            <button
              type="button"
              onClick={() => setDemo('rekha@phc.gov.in')}
              className="border border-zinc-700 bg-zinc-100 px-2 py-1 text-left text-[11px] hover:bg-yellow-200"
            >
              📱 ASHA Worker
            </button>
          </div>
          <div className="mt-2 text-[10px] text-zinc-500">
            Password: <span className="font-mono font-bold">Password@123</span>
          </div>
        </div>
      </form>
    </div>
  );
}
