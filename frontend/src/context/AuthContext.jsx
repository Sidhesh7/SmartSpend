import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('smartspend_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('smartspend_token');
      if (savedToken) {
        try {
          const res = await authService.getMe();
          setUser(res.data.user);
        } catch (err) {
          console.warn('Session expired or invalid. Defaulting to demo session.', err);
          // Auto-login with default analyst account for frictionless experience
          demoLogin('analyst');
        }
      } else {
        // Auto initialize demo analyst account
        demoLogin('analyst');
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    const res = await authService.login(email, password);
    const { user: loggedInUser, token: authToken } = res.data;
    localStorage.setItem('smartspend_token', authToken);
    setToken(authToken);
    setUser(loggedInUser);
    return loggedInUser;
  };

  const demoLogin = async (role = 'analyst') => {
    const email = role === 'admin' ? 'admin@smartspend.ai' : 'analyst@smartspend.ai';
    const password = 'password123';
    try {
      return await login(email, password);
    } catch (err) {
      // Fallback offline mock user
      const mockUser = {
        id: role === 'admin' ? 'user-admin-1' : 'user-analyst-1',
        name: role === 'admin' ? 'Sidhesh (Manager)' : 'Sidhesh (Analyst)',
        email,
        role: role.toUpperCase()
      };
      setUser(mockUser);
      return mockUser;
    }
  };

  const logout = () => {
    localStorage.removeItem('smartspend_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, demoLogin, logout }}>
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
