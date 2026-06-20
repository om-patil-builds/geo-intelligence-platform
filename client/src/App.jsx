import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import { AuthProvider } from './context/AuthContext';
import { PlacesProvider } from './context/PlacesContext';

import PublicRoute from './components/PublicRoute';
import PrivateRoute from './components/PrivateRoute';

import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Results from './pages/Results';
import History from './pages/History';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <PlacesProvider>
          <Toaster 
            position="top-right" 
            toastOptions={{
              style: {
                background: '#112240',
                color: '#e2e8f0',
                border: '1px solid #233554',
              },
              success: {
                iconTheme: {
                  primary: '#22d3ee',
                  secondary: '#06101E',
                },
              },
            }}
          />
          <Routes>
            {/* PUBLIC */}
            <Route path="/" element={<Landing />} />
            
            <Route path="/login" element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } />
            
            <Route path="/register" element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            } />

            {/* PROTECTED */}
            <Route path="/dashboard" element={
              <PrivateRoute>
                <Home />
              </PrivateRoute>
            } />
            
            <Route path="/results" element={
              <PrivateRoute>
                <Results />
              </PrivateRoute>
            } />
            
            <Route path="/history" element={
              <PrivateRoute>
                <History />
              </PrivateRoute>
            } />

            {/* CATCH ALL */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </PlacesProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
