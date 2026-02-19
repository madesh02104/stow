import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import API from "../api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem("stow_token");
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const { data } = await API.get("/auth/me");
      setUser(data);
    } catch (err) {
      // Only clear token on explicit 401 (invalid/expired token).
      // Don't clear on network errors, CORS failures, or server-down scenarios
      // so the user can retry after connectivity is restored.
      if (err.response?.status === 401) {
        localStorage.removeItem("stow_token");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = async (phone, password) => {
    const { data } = await API.post("/auth/login", { phone, password });
    localStorage.setItem("stow_token", data.token);
    setUser(data.user);
    return data;
  };

  const register = async (name, phone, password) => {
    const { data } = await API.post("/auth/register", {
      name,
      phone,
      password,
    });
    localStorage.setItem("stow_token", data.token);
    setUser(data.user);
    return data;
  };

  const logout = () => {
    localStorage.removeItem("stow_token");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        loading,
        login,
        register,
        logout,
        refreshUser: loadUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
