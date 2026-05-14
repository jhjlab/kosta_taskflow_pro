const API_BASE = 'http://localhost:8000/api/v1';
const TOKEN_KEY = 'taskflow_token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function request(path, { method = 'GET', body } = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return null;

  const data = await res.json().catch(() => ({ detail: res.statusText }));
  if (!res.ok) {
    const err = new Error(data.detail ?? '요청 실패');
    err.status = res.status;
    throw err;
  }
  return data;
}

export const api = {
  tasks: {
    list:   ()         => request('/tasks/'),
    create: (data)     => request('/tasks/',       { method: 'POST',   body: data }),
    get:    (id)       => request(`/tasks/${id}`),
    update: (id, data) => request(`/tasks/${id}`,  { method: 'PUT',    body: data }),
    remove: (id)       => request(`/tasks/${id}`,  { method: 'DELETE' }),
  },

  auth: {
    async login(email, password) {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ username: email, password }),
      });
      const data = await res.json().catch(() => ({ detail: res.statusText }));
      if (!res.ok) {
        const err = new Error(data.detail ?? '로그인 실패');
        err.status = res.status;
        throw err;
      }
      return data;
    },

    register: (email, password, fullName) =>
      request('/auth/register', {
        method: 'POST',
        body: { email, password, full_name: fullName || undefined },
      }),
  },
};
