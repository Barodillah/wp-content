import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
    try {
      const res = await api.me();
      if (res && res.data) {
        setUser(res.data);
      } else {
        setUser(null);
      }
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (username, password) => {
    const res = await api.login(username, password);
    if (res && res.data) {
      setUser(res.data);
      return res.data;
    }
    throw new Error('Gagal masuk');
  };

  const logout = async () => {
    try {
      await api.logout();
    } finally {
      setUser(null);
    }
  };

  const isSuperuser = user?.role === 'superuser';
  const canUpload = isSuperuser || !!parseInt(user?.can_upload || 0);
  const canDelete = isSuperuser || !!parseInt(user?.can_delete || 0);
  const canRename = isSuperuser || !!parseInt(user?.can_rename || 0);
  const canMove = isSuperuser || !!parseInt(user?.can_move || 0);

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    isSuperuser,
    canUpload,
    canDelete,
    canRename,
    canMove,
    login,
    logout,
    refreshUser: checkAuth
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
