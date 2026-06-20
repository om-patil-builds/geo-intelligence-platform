import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LandingNavbar from '../components/LandingNavbar';
import toast from 'react-hot-toast';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { register } = useAuth();

  const validate = () => {
    const newErrors = {};
    if (!name || name.length < 2) newErrors.name = 'Name must be at least 2 characters';
    if (!email || !/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Valid email is required';
    if (!password || password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords must match';
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    setErrors({});
    setApiError(null);
    setIsSubmitting(true);
    try {
      await register(name, email, password);
      toast.success('Account created! Welcome to geoLead AI');
    } catch (err) {
      setApiError('Failed to create account. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-base flex flex-col">
      <LandingNavbar />
      
      <div className="flex-1 flex items-center justify-center p-4 pt-24 pb-12">
        <div className="bg-card border border-dim rounded-2xl p-8 w-full max-w-sm shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="font-display text-[24px] font-bold text-white mb-2">Create your account</h1>
            <p className="text-[13px] text-t2">Start finding leads in under a minute</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-mono text-t3 uppercase tracking-wider mb-2">Full Name</label>
              <input 
                type="text" 
                placeholder="Shubham Jadhav"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-bg-hover border border-dim rounded-lg p-3 focus:border-cyan outline-none font-body text-[14px] text-t1 transition-colors"
              />
              {errors.name && <p className="text-lead-red text-[12px] mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-[11px] font-mono text-t3 uppercase tracking-wider mb-2">Email address</label>
              <input 
                type="email" 
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-bg-hover border border-dim rounded-lg p-3 focus:border-cyan outline-none font-body text-[14px] text-t1 transition-colors"
              />
              {errors.email && <p className="text-lead-red text-[12px] mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-[11px] font-mono text-t3 uppercase tracking-wider mb-2">Password</label>
              <input 
                type="password" 
                placeholder="Min. 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-bg-hover border border-dim rounded-lg p-3 focus:border-cyan outline-none font-body text-[14px] text-t1 transition-colors"
              />
              {errors.password && <p className="text-lead-red text-[12px] mt-1">{errors.password}</p>}
            </div>
            
            <div>
              <label className="block text-[11px] font-mono text-t3 uppercase tracking-wider mb-2">Confirm Password</label>
              <input 
                type="password" 
                placeholder="Repeat password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-bg-hover border border-dim rounded-lg p-3 focus:border-cyan outline-none font-body text-[14px] text-t1 transition-colors"
              />
              {errors.confirmPassword && <p className="text-lead-red text-[12px] mt-1">{errors.confirmPassword}</p>}
            </div>

            {apiError && (
              <div className="bg-red-d border border-lead-red rounded-lg p-3 text-[13px] text-lead-red mt-4">
                {apiError}
              </div>
            )}

            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full mt-6 bg-gradient-btn text-dark font-display font-bold text-[14px] py-3 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {isSubmitting ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <div className="text-center mt-6">
            <span className="text-[13px] text-t2">Already have an account? </span>
            <Link to="/login" className="text-[13px] text-cyan hover:underline">Sign in →</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
