import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Globe, LogOut, Menu, X, User } from 'lucide-react';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setIsOpen(false);
    navigate('/login');
  };

  const navLinkClass = ({ isActive }) =>
    `px-3 py-2 rounded-lg text-sm font-medium transition-all ${
      isActive
        ? 'text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/40'
        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
    }`;

  return (
    <nav className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2 font-bold text-xl text-slate-800 dark:text-white">
              <div className="p-2 bg-gradient-to-tr from-violet-600 to-indigo-600 rounded-xl text-white shadow-md shadow-violet-500/20">
                <Globe className="w-5 h-5 animate-spin-slow" />
              </div>
              <span className="bg-gradient-to-r from-violet-600 to-indigo-600 dark:from-violet-400 dark:to-indigo-400 bg-clip-text text-transparent tracking-tight font-extrabold">
                GeoIntel
              </span>
            </Link>
          </div>

          {/* Desktop Nav Items */}
          <div className="hidden md:flex items-center gap-6">
            {isAuthenticated ? (
              <>
                <NavLink to="/dashboard" className={navLinkClass}>
                  Dashboard
                </NavLink>
                <NavLink to="/history" className={navLinkClass}>
                  Search History
                </NavLink>
              </>
            ) : (
              <NavLink to="/" className={navLinkClass}>
                Home
              </NavLink>
            )}
            <NavLink to="/pricing" className={navLinkClass}>
              Pricing
            </NavLink>
            <NavLink to="/faq" className={navLinkClass}>
              FAQ
            </NavLink>
          </div>

          {/* Auth buttons */}
          <div className="hidden md:flex items-center gap-4">
            {isAuthenticated ? (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700">
                  <User className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {user?.name || 'User'}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 rounded-xl shadow-md shadow-violet-500/20 hover:shadow-violet-500/30 transition-all duration-300 transform hover:-translate-y-0.5"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {isAuthenticated ? (
              <>
                <NavLink
                  to="/dashboard"
                  onClick={() => setIsOpen(false)}
                  className="block px-3 py-2.5 rounded-xl text-base font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Dashboard
                </NavLink>
                <NavLink
                  to="/history"
                  onClick={() => setIsOpen(false)}
                  className="block px-3 py-2.5 rounded-xl text-base font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Search History
                </NavLink>
                <NavLink
                  to="/pricing"
                  onClick={() => setIsOpen(false)}
                  className="block px-3 py-2.5 rounded-xl text-base font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Pricing
                </NavLink>
                <NavLink
                  to="/faq"
                  onClick={() => setIsOpen(false)}
                  className="block px-3 py-2.5 rounded-xl text-base font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  FAQ
                </NavLink>
                <div className="border-t border-slate-200 dark:border-slate-800 my-2 pt-2">
                  <div className="px-3 py-2 flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    <User className="w-5 h-5" />
                    <span className="text-sm font-semibold">{user?.name}</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-base font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 text-left"
                  >
                    <LogOut className="w-5 h-5" />
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <>
                <NavLink
                  to="/"
                  onClick={() => setIsOpen(false)}
                  className="block px-3 py-2.5 rounded-xl text-base font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Home
                </NavLink>
                <NavLink
                  to="/pricing"
                  onClick={() => setIsOpen(false)}
                  className="block px-3 py-2.5 rounded-xl text-base font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Pricing
                </NavLink>
                <NavLink
                  to="/faq"
                  onClick={() => setIsOpen(false)}
                  className="block px-3 py-2.5 rounded-xl text-base font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  FAQ
                </NavLink>
                <div className="border-t border-slate-200 dark:border-slate-800 my-2 pt-2 flex flex-col gap-2 px-3">
                  <Link
                    to="/login"
                    onClick={() => setIsOpen(false)}
                    className="w-full text-center py-2.5 rounded-xl text-base font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800"
                  >
                    Log In
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setIsOpen(false)}
                    className="w-full text-center py-2.5 rounded-xl text-base font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600"
                  >
                    Register
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
