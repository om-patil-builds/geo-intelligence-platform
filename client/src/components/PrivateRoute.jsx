import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingRadar from './LoadingRadar';

export default function PrivateRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <LoadingRadar />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}
