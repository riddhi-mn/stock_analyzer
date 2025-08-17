// client/src/api/index.js
import axios from 'axios';

export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

// --- helpers ---
function setToken(token) {
  if (token) {
    localStorage.setItem('token', token);
    API.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    localStorage.removeItem('token');
    delete API.defaults.headers.common.Authorization;
  }
}

// Axios instance
const API = axios.create({
  baseURL: API_BASE,
  withCredentials: true, // so cookies (refreshToken) are sent to /auth/refresh if you ever use axios for it
});

// Attach JWT on every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ---- 401 auto-refresh logic ----
let isRefreshing = false;
let pendingQueue = []; // requests waiting for a fresh token

function processQueue(error, newToken = null) {
  pendingQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(newToken);
  });
  pendingQueue = [];
}

API.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;

    // If no response or not a 401, just bail
    if (!error.response || error.response.status !== 401) {
      return Promise.reject(error);
    }

    // Prevent retrying the refresh call itself
    if (original._retry || original.url?.includes('/auth/refresh')) {
      return Promise.reject(error);
    }
    original._retry = true;

    // If a refresh is already in progress, wait for it
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push({
          resolve: (newToken) => {
            if (newToken) {
              original.headers.Authorization = `Bearer ${newToken}`;
            }
            resolve(API(original));
          },
          reject,
        });
      });
    }

    // Start refresh
    isRefreshing = true;
    try {
      // Use fetch here so we’re not re-entering the same axios interceptor stack
      const resp = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!resp.ok) throw new Error('Refresh failed');
      const data = await resp.json();
      const newToken = data.accessToken;

      setToken(newToken);
      processQueue(null, newToken);

      // Retry the original request with the new token
      original.headers.Authorization = `Bearer ${newToken}`;
      return API(original);
    } catch (refreshErr) {
      processQueue(refreshErr, null);
      setToken(null); // clear token
      // optional: redirect to login
      window.location.href = '/login';
      return Promise.reject(refreshErr);
    } finally {
      isRefreshing = false;
    }
  }
);

export default API;
export { setToken };
