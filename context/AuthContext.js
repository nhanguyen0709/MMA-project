// Auth Context for managing user state
import React, { createContext, useState, useEffect } from "react";
import { getCurrentUser, loginUser, registerUser, logoutUser } from "../services/authService";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error("Auth check error:", error);
    } finally {
      setInitializing(false);
    }
  };

  const login = async (email, password) => {
    const user = await loginUser(email, password);
    setUser(user);
    return user;
  };

  const register = async (email, password) => {
    const user = await registerUser(email, password);
    setUser(user);
    return user;
  };

  const logout = async () => {
    await logoutUser();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      initializing, 
      login, 
      register, 
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
}