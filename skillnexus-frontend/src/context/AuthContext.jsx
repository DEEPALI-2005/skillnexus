import { createContext, useState, useEffect, useContext } from "react";
import api from "../api/axios";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // App load hote hi check karo ki user pehle se logged in hai kya
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          // Backend se current user ki details mango
          const res = await api.get("/auth/me");
          setUser(res.data.data);
        } catch (error) {
          // Agar token invalid hai (expire ho gaya)
          localStorage.removeItem("token");
          setUser(null);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  // Login Function
  const login = async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    localStorage.setItem("token", res.data.data.token);
    
    // User data fetch karo
    const userRes = await api.get("/auth/me");
    setUser(userRes.data.data);
    
    return res.data;
  };

  // Register Function
  const register = async (name, email, password, role) => {
    const res = await api.post("/auth/register", { name, email, password, role });
    // Register hote hi login karva do
    return await login(email, password);
  };

  // Logout Function
  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);