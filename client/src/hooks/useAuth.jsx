import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService, settingsService } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('pos_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('pos_token') || null);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState(null);

  // Load settings globally
  const refreshSettings = async () => {
    try {
      const res = await settingsService.getSettings();
      if (res.success) {
        setSettings(res.settings);
      }
    } catch (err) {
      console.warn('Could not load system settings:', err.message);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('pos_token');
      if (savedToken) {
        try {
          const res = await authService.getMe();
          if (res.success && res.user) {
            setUser(res.user);
            localStorage.setItem('pos_user', JSON.stringify(res.user));
          }
        } catch (err) {
          console.warn('Session expired or invalid:', err.message);
          logout();
        }
      }
      await refreshSettings();
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (username, password) => {
    const res = await authService.login({ username, password });
    if (res.success && res.token) {
      setToken(res.token);
      setUser(res.user);
      localStorage.setItem('pos_token', res.token);
      localStorage.setItem('pos_user', JSON.stringify(res.user));
      await refreshSettings();
      return res.user;
    }
    throw new Error(res.message || 'Login failed.');
  };

  const logout = () => {
    localStorage.removeItem('pos_token');
    localStorage.removeItem('pos_user');
    setToken(null);
    setUser(null);
  };

  const isAdmin = user?.role === 'admin';
  const isCashier = user?.role === 'cashier';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        settings,
        refreshSettings,
        login,
        logout,
        isAdmin,
        isCashier,
        isAuthenticated: !!token && !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
