import api, { setAuthToken } from "./axios";

export async function signup(payload) {
  const res = await api.post("/api/auth/signup", payload);
  return res.data;
}

export async function login(payload) {
  const res = await api.post("/api/auth/login", payload);
  return res.data;
}

export async function logout() {
  const res = await api.post("/api/auth/logout");
  return res.data;
}

export async function getProfile() {
  const res = await api.get("/api/auth/profile");
  return res.data;
}

/* ===== NEW: PASSWORD & VERIFICATION ===== */

export async function forgotPassword(email) {
  const res = await api.post("/api/auth/forgot-password", { email });
  return res.data;
}

export async function resetPassword(token, password) {
  const res = await api.post("/api/auth/reset-password", { token, password });
  return res.data;
}

export async function verifyEmail(token) {
  const res = await api.get(`/api/auth/verify-email?token=${token}`);
  return res.data;
}

export { setAuthToken };

export default {
  signup,
  login,
  logout,
  getProfile,
  forgotPassword,
  resetPassword,
  verifyEmail,
};
