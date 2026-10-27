import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  timeout: 30000,
});

let pending = 0;
const listeners = new Set();

function notify() {
  listeners.forEach((fn) => fn(pending > 0, pending));
}

export function subscribeLoading(fn) {
  listeners.add(fn);
  fn(pending > 0, pending);
  return () => listeners.delete(fn);
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('mk_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  pending += 1;
  notify();
  return config;
});

function settle() {
  pending = Math.max(0, pending - 1);
  notify();
}

api.interceptors.response.use(
  (res) => {
    settle();
    return res;
  },
  (err) => {
    settle();
    if (err.response?.status === 401) {
      localStorage.removeItem('mk_token');
      localStorage.removeItem('mk_user');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;
