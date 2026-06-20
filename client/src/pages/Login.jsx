import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LandingNavbar from '../components/LandingNavbar';
import toast from 'react-hot-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    try {
      await login(email, password);
      toast.success('Welcome back!');
      // navigation is handled by AuthContext or PublicRoute but mostly 
      // the useAuth login does not navigate, it just changes auth state,
      // and PublicRoute will then redirect to /dashboard since it watches isAuthenticated.
      // Wait, let's explicitly navigate in the form just in case, but actually PublicRoute is better.
      // Wait, PublicRoute wrapper around Login handles it automatically!
    } catch (err) {
      setError('Invalid credentials');
      toast.error('Invalid credentials');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-base flex flex-col">
      <LandingNavbar />
      
      <div className="flex-1 flex items-center justify-center p-4 pt-20">
        <div className="bg-card border border-dim rounded-2xl p-8 w-full max-w-sm shadow-2xl">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
               <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan to-indigo flex items-center justify-center">
                 <span className="text-white text-sm font-bold">g</span>
               </div>
            </div>
            <h1 className="font-display text-[24px] font-bold text-white mb-2">Welcome back</h1>
            <p className="text-[13px] text-t2">Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-mono text-t3 uppercase tracking-wider mb-2">Email address</label>
              <input 
                type="email" 
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-bg-hover border border-dim rounded-lg p-3 focus:border-cyan outline-none font-body text-[14px] text-t1 transition-colors"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-t3 uppercase tracking-wider mb-2">Password</label>
              <input 
                type="password" 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-bg-hover border border-dim rounded-lg p-3 focus:border-cyan outline-none font-body text-[14px] text-t1 transition-colors"
              />
              <div className="text-right mt-2">
                <a href="#" className="text-[12px] text-cyan hover:underline">Forgot password?</a>
              </div>
            </div>

            {error && (
              <div className="bg-red-d border border-lead-red rounded-lg p-3 text-[13px] text-lead-red">
                {error}
              </div>
            )}

            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full mt-6 bg-gradient-btn text-dark font-display font-bold text-[14px] py-3 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {isSubmitting ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="text-center text-t3 text-[12px] my-5">— or —</div>

          <div className="text-center">
            <span className="text-[13px] text-t2">Don't have an account? </span>
            <Link to="/register" className="text-[13px] text-cyan hover:underline">Create one →</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
