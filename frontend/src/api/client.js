// frontend/src/api/axios.js
// Phase 2 upgrade: refresh-token interceptor, 423 lockout handling
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || "http://localhost:4000",
  headers: { "Content-Type": "application/json" },
});

// ── Token helpers ─────────────────────────────────────────────────────────
export function setAuthToken(token) {
  if (token) api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  else delete api.defaults.headers.common["Authorization"];
}

// ── Request interceptor — always attach access token ─────────────────────
api.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers = config.headers || {};
      config.headers["Authorization"] = `Bearer ${token}`;
    }
  } catch {}
  return config;
});

// ── Response interceptor — auto-refresh on 401 ───────────────────────────
let _isRefreshing = false;
let _waitQueue = []; // queued requests while refresh in flight

function processQueue(error, token = null) {
  _waitQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token)));
  _waitQueue = [];
}

api.interceptors.response.use(
  (response) => response, // 2xx — pass through
  async (error) => {
    const original = error.config;

    // Avoid infinite loops: don't retry the /refresh call itself
    if (error?.response?.status === 401 && !original._retry && !original.url?.includes("/auth/refresh")) {
      if (_isRefreshing) {
        // Another refresh is already in-flight — queue this request
        return new Promise((resolve, reject) => {
          _waitQueue.push({ resolve, reject });
        }).then((token) => {
          original.headers["Authorization"] = `Bearer ${token}`;
          return api(original);
        });
      }

      original._retry = true;
      _isRefreshing = true;

      const refreshToken = localStorage.getItem("refreshToken");
      if (!refreshToken) {
        _isRefreshing = false;
        _forceLogout();
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(
          `${api.defaults.baseURL}/api/auth/refresh`,
          { refreshToken }
        );
        const newAccessToken = data.accessToken;
        const newRefreshToken = data.refreshToken;

        localStorage.setItem("accessToken", newAccessToken);
        localStorage.setItem("refreshToken", newRefreshToken);
        setAuthToken(newAccessToken);

        processQueue(null, newAccessToken);
        original.headers["Authorization"] = `Bearer ${newAccessToken}`;
        return api(original);
      } catch (refreshError) {
        processQueue(refreshError, null);
        _forceLogout();
        return Promise.reject(refreshError);
      } finally {
        _isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

function _forceLogout() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  setAuthToken(null);
  // Soft redirect — avoids hard dependency on router
  if (window.location.pathname !== "/login") {
    window.location.href = "/login";
  }
}

export default api;
