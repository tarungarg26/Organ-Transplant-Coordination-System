import React from 'react';
import { createContext, useContext, useEffect, useState } from "react";
import api from "./api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("otcs_user");
    return raw ? JSON.parse(raw) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("otcs_token");
    if (!token) return setLoading(false);
    api.get("/auth/me")
      .then(res => {
        const u = res.data.user;
        const normalized = u ? { ...u, id: u.id || u._id } : null;
        if (normalized) localStorage.setItem("otcs_user", JSON.stringify(normalized));
        setUser(normalized);
      })
      .catch(() => {
        localStorage.removeItem("otcs_token");
        localStorage.removeItem("otcs_user");
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    const normalized = { ...data.user, id: data.user?.id || data.user?._id };
    localStorage.setItem("otcs_token", data.token);
    localStorage.setItem("otcs_user", JSON.stringify(normalized));
    setUser(normalized);
    return normalized;
  };

  const logout = () => {
    localStorage.removeItem("otcs_token");
    localStorage.removeItem("otcs_user");
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
