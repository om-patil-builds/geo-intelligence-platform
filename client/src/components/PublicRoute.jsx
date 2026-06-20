import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingRadar from './LoadingRadar';

export default function PublicRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <LoadingRadar />;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return children;
}
