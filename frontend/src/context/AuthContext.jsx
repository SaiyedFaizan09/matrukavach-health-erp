import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '../api/services';

export function normalizeRole(r) {
  if (!r) return '';
  const up = String(r).toUpperCase().trim();
  if (up === 'PHC_MO') return 'MEDICAL_OFFICER';
  if (up === 'BLOCK_ADMIN') return 'BLOCK_ADMIN';
  if (up === 'ANM') return 'ANM';
  if (up === 'ASHA') return 'ASHA';
  return up;
}

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('mk_user') || 'null');
      if (stored) {
        stored.role = normalizeRole(stored.role);
      }
      return stored;
    } catch {
      return null;
    }
  });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('mk_token');
    if (!token) {
      setReady(true);
      return;
    }
    authApi
      .me()
      .then((u) => {
        const normalized = { ...u, role: normalizeRole(u?.role) };
        setUser(normalized);
        localStorage.setItem('mk_user', JSON.stringify(normalized));
      })
      .catch(() => {
        setUser(null);
        localStorage.removeItem('mk_token');
        localStorage.removeItem('mk_user');
      })
      .finally(() => setReady(true));
  }, []);

  const value = useMemo(
    () => ({
      user,
      ready,
      login: (token, nextUser) => {
        const normalized = { ...nextUser, role: normalizeRole(nextUser?.role) };
        localStorage.setItem('mk_token', token);
        localStorage.setItem('mk_user', JSON.stringify(normalized));
        setUser(normalized);
      },
      logout: () => {
        localStorage.removeItem('mk_token');
        localStorage.removeItem('mk_user');
        setUser(null);
      },
    }),
    [user, ready]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
