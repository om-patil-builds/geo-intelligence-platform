import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { usePlaces } from './PlacesContext';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const navigate = useNavigate();
  // We need to access PlacesContext to clear it on logout
  // Wait, PlacesProvider is *inside* AuthProvider according to the specs:
  // "PlacesProvider <- inside auth (places needs auth context)"
  // So we can't use `usePlaces` directly here if it's rendered below us.
  // Instead, the App will clear context or we handle it in a component.
  // Or better, we just let the PlacesProvider clear itself on mount if unauthenticated.
  
  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          const response = await authAPI.me();
          setUser(response.data.user);
          setToken(storedToken);
        } catch (error) {
          localStorage.removeItem('token');
          setUser(null);
          setToken(null);
        }
      }
      setIsLoading(false);
    };
    checkAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await authAPI.login(email, password);
      const { token: newToken, user: newUser } = response.data;
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(newUser);
      return { success: true };
    } catch (error) {
      throw error;
    }
  };

  const register = async (name, email, password) => {
    try {
      const response = await authAPI.register(name, email, password);
      const { token: newToken, user: newUser } = response.data;
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(newUser);
      return { success: true };
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    navigate('/', { replace: true });
  };

  const isAuthenticated = !!token;

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
