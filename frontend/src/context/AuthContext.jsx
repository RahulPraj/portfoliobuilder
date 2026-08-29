import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/axios.js";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // On refresh, we simply trust localStorage's cached profile; a real app
    // would also hit /me endpoints here to revalidate.
    const cachedUser = localStorage.getItem("user");
    const cachedAdmin = localStorage.getItem("admin");
    if (cachedUser) setUser(JSON.parse(cachedUser));
    if (cachedAdmin) setAdmin(JSON.parse(cachedAdmin));
    setLoading(false);
  }, []);

  const loginUser = async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    localStorage.setItem("accessToken", data.accessToken);
    localStorage.setItem("user", JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  const registerUser = async (name, email, password) => {
    const { data } = await api.post("/auth/register", { name, email, password });
    localStorage.setItem("accessToken", data.accessToken);
    localStorage.setItem("user", JSON.stringify(data.user));
    setUser(data.user);
    return data;
  };

  const loginAdmin = async (email, password) => {
    const { data } = await api.post("/auth/admin/login", { email, password });
    localStorage.setItem("accessToken", data.accessToken);
    localStorage.setItem("admin", JSON.stringify(data.admin));
    setAdmin(data.admin);
    return data.admin;
  };

  const logout = async () => {
    await api.post("/auth/logout");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    localStorage.removeItem("admin");
    setUser(null);
    setAdmin(null);
  };

  return (
    <AuthContext.Provider value={{ user, admin, loading, loginUser, registerUser, loginAdmin, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
