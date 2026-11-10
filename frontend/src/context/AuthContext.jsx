import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('stockflow_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('stockflow_token'));
  const [loading, setLoading] = useState(true);

  // Verify and refresh current user profile on load
  useEffect(() => {
    const checkAuth = async () => {
      const savedToken = localStorage.getItem('stockflow_token');
      if (savedToken) {
        try {
          const res = await api.get('/auth/me');
          if (res.data.success && res.data.user) {
            setUser(res.data.user);
            localStorage.setItem('stockflow_user', JSON.stringify(res.data.user));
          }
        } catch (err) {
          console.error('Failed to restore auth session:', err);
          logout();
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data.success) {
      const { token, user } = res.data;
      localStorage.setItem('stockflow_token', token);
      localStorage.setItem('stockflow_user', JSON.stringify(user));
      setToken(token);
      setUser(user);
      return res.data;
    }
    throw new Error(res.data.message || 'Login failed');
  };

  const signup = async (payload) => {
    const res = await api.post('/auth/signup', payload);
    if (res.data.success) {
      const { token, user } = res.data;
      localStorage.setItem('stockflow_token', token);
      localStorage.setItem('stockflow_user', JSON.stringify(user));
      setToken(token);
      setUser(user);
      return res.data;
    }
    throw new Error(res.data.message || 'Registration failed');
  };

  const logout = () => {
    localStorage.removeItem('stockflow_token');
    localStorage.removeItem('stockflow_user');
    setToken(null);
    setUser(null);
  };

  const updateUser = (updatedUser) => {
    setUser(prev => {
      const merged = { ...prev, ...updatedUser };
      localStorage.setItem('stockflow_user', JSON.stringify(merged));
      return merged;
    });
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      isAuthenticated: !!token && !!user,
      login,
      signup,
      logout,
      updateUser
    }}>
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

