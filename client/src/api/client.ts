import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const client = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

client.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      const url = err.config?.url || '';
      // Do not intercept auth endpoint failures — those are expected invalid-credential
      // responses that the page-level catch block handles with a user-facing message.
      if (url.includes('/auth/login') || url.includes('/auth/register')) {
        return Promise.reject(err);
      }
      // For all other 401s (expired token, bad token), logout and redirect.
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default client;

// Auth API
export const authApi = {
  register: (data: { email: string; password: string; name: string }) =>
    client.post<{ token: string; user: { id: string; email: string; name: string } }>('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    client.post<{ token: string; user: { id: string; email: string; name: string } }>('/auth/login', data),
};

// Campaign API
export const campaignApi = {
  list: () => client.get('/campaigns'),
  create: (data: { name: string; subject: string; body?: string; emails: { email: string; name: string }[] }) =>
    client.post('/campaigns', data),
  get: (id: string) => client.get(`/campaigns/${id}`),
  update: (id: string, data: { name?: string; subject?: string; body?: string }) =>
    client.patch(`/campaigns/${id}`, data),
  delete: (id: string) => client.delete(`/campaigns/${id}`),
  schedule: (id: string, scheduledAt: string) =>
    client.post(`/campaigns/${id}/schedule`, { scheduled_at: scheduledAt }),
  send: (id: string) => client.post(`/campaigns/${id}/send`),
  stats: (id: string) =>
    client.get<{ total: number; sent: number; failed: number; opened: number; open_rate: number; send_rate: number }>(
      `/campaigns/${id}/stats`
    ),
  addRecipients: (id: string, emails: { email: string; name: string }[]) =>
    client.post(`/campaigns/${id}/recipients`, { emails }),
  listRecipients: (id: string) => client.get(`/campaigns/${id}/recipients`),
};

// Recipient API
export const recipientApi = {
  list: () => client.get('/recipients'),
  create: (data: { email: string; name: string }) => client.post('/recipients', data),
};
