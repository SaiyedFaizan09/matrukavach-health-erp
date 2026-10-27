import api from './axiosInstance';

export const authApi = {
  login: (payload) => api.post('/auth/login', payload).then((r) => r.data),
  me: () => api.get('/auth/me').then((r) => r.data),
};

export const userApi = {
  list: (params) => api.get('/users', { params }).then((r) => r.data),
  create: (payload) => api.post('/users', payload).then((r) => r.data),
  update: (id, payload) => api.put(`/users/${id}`, payload).then((r) => r.data),
};

export const beneficiaryApi = {
  list: (params) => api.get('/beneficiaries', { params }).then((r) => r.data),
  watchlist: () => api.get('/beneficiaries/watchlist').then((r) => r.data),
  eddAlerts: () => api.get('/beneficiaries/edd-alerts').then((r) => r.data),
  get: (id) => api.get(`/beneficiaries/${id}`).then((r) => r.data),
  timeline: (id) => api.get(`/beneficiaries/${id}/timeline`).then((r) => r.data),
  create: (payload) => api.post('/beneficiaries', payload).then((r) => r.data),
  update: (id, payload) => api.put(`/beneficiaries/${id}`, payload).then((r) => r.data),
};

export const campApi = {
  getSheet: (params) => api.get('/camps', { params }).then((r) => r.data),
  carryForward: (payload) => api.post('/camps/carry-forward', payload).then((r) => r.data),
  updateSheet: (id, payload) => api.put(`/camps/${id}`, payload).then((r) => r.data),
  lock: (id) => api.post(`/camps/${id}/lock`).then((r) => r.data),
  unlock: (id) => api.post(`/camps/${id}/unlock`).then((r) => r.data),
  createScreening: (payload) => api.post('/camps/screenings', payload).then((r) => r.data),
  updateScreening: (id, payload) => api.put(`/camps/screenings/${id}`, payload).then((r) => r.data),
  deleteScreening: (id) => api.delete(`/camps/screenings/${id}`).then((r) => r.data),
  sendCard: (id) => api.post(`/camps/screenings/${id}/send-card`).then((r) => r.data),
};

export const ambulanceApi = {
  list: (params) => api.get('/ambulance', { params }).then((r) => r.data),
  create: (payload) => api.post('/ambulance', payload).then((r) => r.data),
  update: (id, payload) => api.put(`/ambulance/${id}`, payload).then((r) => r.data),
  remove: (id) => api.delete(`/ambulance/${id}`).then((r) => r.data),
};

export const reportApi = {
  monthly: (params) => api.get('/reports/monthly', { params }).then((r) => r.data),
  villages: () => api.get('/reports/villages').then((r) => r.data),
};
