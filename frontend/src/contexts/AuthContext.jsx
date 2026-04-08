// frontend/src/contexts/AuthContext.jsx
// Phase 2 upgrade: accessToken + refreshToken dual-storage, refresh-aware login
import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { login as apiLogin, logout as apiLogout, getProfile } from "../api/auth.axios";
import { setAuthToken } from "../api/axios";

export const AuthContext = createContext({
  user: null,
  loading: true,
  login: async () => {},
  logout: () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // ── On mount: restore session from localStorage ───────────────────────
  useEffect(() => {
    (async () => {
      const accessToken = localStorage.getItem("accessToken");

      if (accessToken) {
        setAuthToken(accessToken);
        try {
          const data = await getProfile();
          if (data?.user) {
            setUser(data.user);
          } else {
            _clearStorage();
          }
        } catch {
          // Token expired — interceptor in axios.js will attempt refresh.
          // If that also fails it calls _forceLogout() itself.
          // Just clear local state here.
          _clearStorage();
        }
      }

      setLoading(false);
    })();
  }, []);

  // ── login() — called from Login.jsx on form submit ────────────────────
  async function login(email, password) {
    const data = await apiLogin({ email, password });
    // Backend Phase 2 returns: { accessToken, refreshToken, user }
    if (data?.accessToken) {
      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("refreshToken", data.refreshToken);
      setAuthToken(data.accessToken);
      setUser(data.user);
      return data;
    }
    throw new Error(data?.message || "Login failed");
  }

  // ── logout() — calls backend to revoke session, then clears local state
  async function logout() {
    try {
      await apiLogout();
    } catch {
      // Backend error on logout is non-fatal; clear locally regardless
    } finally {
      _clearStorage();
      setUser(null);
      navigate("/login", { replace: true });
    }
  }

  function _clearStorage() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    setAuthToken(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

/** useAuth() hook */
export function useAuth() {
  return useContext(AuthContext);
}
