import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, Activity } from 'lucide-react';

export default function AppNavbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="sticky top-0 w-full h-[64px] bg-surface border-b border-dim z-40">
      <div className="max-w-full mx-auto px-6 h-full flex items-center justify-between">
        
        {/* Left: Logo */}
        <Link to="/dashboard" className="flex items-center gap-2">
          <span className="font-display font-bold text-[18px]">
            <span className="text-lead-cyan">geo</span>
            <span className="text-white">Lead</span>
            <span className="text-gradient"> AI</span>
          </span>
        </Link>

        {/* Center: Nav links */}
        <div className="hidden md:flex items-center gap-6 absolute left-1/2 -translate-x-1/2 h-full">
          <NavLink 
            to="/dashboard" 
            className={({ isActive }) => 
              `text-[14px] font-medium h-full flex items-center border-b-2 transition-colors ${isActive ? 'border-cyan text-cyan' : 'border-transparent text-t2 hover:text-t1'}`
            }
          >
            Dashboard
          </NavLink>
          <NavLink 
            to="/results" 
            className={({ isActive }) => 
              `text-[14px] font-medium h-full flex items-center border-b-2 transition-colors ${isActive ? 'border-cyan text-cyan' : 'border-transparent text-t2 hover:text-t1'}`
            }
          >
            Results
          </NavLink>
          <NavLink 
            to="/history" 
            className={({ isActive }) => 
              `text-[14px] font-medium h-full flex items-center border-b-2 transition-colors ${isActive ? 'border-cyan text-cyan' : 'border-transparent text-t2 hover:text-t1'}`
            }
          >
            History
          </NavLink>
        </div>

        {/* Right: User */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 text-[12px] text-t3 border border-dim rounded-full px-3 py-1">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan"></span>
            </span>
            AI Engine Ready
          </div>
          
          <div className="flex items-center gap-3 pl-4 border-l border-dim">
            <div className="w-[32px] h-[32px] rounded-full bg-cyan-d text-cyan flex items-center justify-center text-sm font-bold">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <span className="text-[13px] text-t2 hidden md:block">{user?.name}</span>
            <button 
              onClick={logout} 
              className="p-1.5 text-t3 hover:text-lead-red transition-colors"
              title="Sign out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>

      </div>
    </nav>
  );
}
