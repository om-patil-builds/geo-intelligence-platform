import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Globe, Lock, Mail } from 'lucide-react';
import ErrorMessage from '../components/ErrorMessage';


const Login = () => {
  const { login, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const redirectPath = searchParams.get('redirect') || 'dashboard';
  const keyword = searchParams.get('keyword');
  const location = searchParams.get('location') || searchParams.get('city');
  const radius = searchParams.get('radius');

  // If already authenticated, redirect
  useEffect(() => {
    if (isAuthenticated) {
      const destParams = new URLSearchParams();
      if (keyword) destParams.append('keyword', keyword);
      if (location) destParams.append('location', location);
      if (radius) destParams.append('radius', radius);
      
      const queryStr = destParams.toString();
      navigate(`/${redirectPath}${queryStr ? '?' + queryStr : ''}`);
    }
  }, [isAuthenticated, navigate, redirectPath, keyword, location, radius]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanEmail = email.trim();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    const result = await login(cleanEmail, cleanPassword);
    if (!result.success) {
      setErrorMsg(result.message);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-10 px-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-xl shadow-slate-100 dark:shadow-none transition">
        {/* Logo and Brand */}
        <div className="flex flex-col items-center mb-6">
          <div className="p-3 bg-gradient-to-tr from-violet-600 to-indigo-600 rounded-2xl text-white shadow-lg shadow-violet-500/20 mb-3">
            <Globe className="w-6 h-6 animate-spin-slow" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight">
            Welcome Back
          </h2>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5">
            Log in to manage your geo-prospecting workspace
          </p>
        </div>

        {/* Redirect notice */}
        {keyword && location && (
          <div className="mb-4 flex items-start gap-2.5 p-3.5 bg-amber-50 border border-amber-200 dark:bg-amber-950/20 dark:border-amber-900/50 rounded-xl text-xs text-amber-800 dark:text-amber-300 font-semibold leading-relaxed">
            <Lock className="w-4 h-4 shrink-0 mt-0.5" />
            <span>Please log in to process your search for "{keyword}" in "{location}".</span>
          </div>
        )}

        {/* Error Message */}
        {errorMsg && <ErrorMessage message={errorMsg} onClose={() => setErrorMsg('')} />}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 text-slate-950 dark:text-slate-50 border border-slate-200 dark:border-slate-800 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 rounded-xl outline-none transition text-sm"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 text-slate-950 dark:text-slate-50 border border-slate-200 dark:border-slate-800 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 rounded-xl outline-none transition text-sm"
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 rounded-xl shadow-lg shadow-violet-500/20 hover:shadow-violet-500/30 transition duration-300 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Signing in...</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>

        {/* Footer link */}
        <div className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
          Don't have an account?{' '}
          <Link
            to={`/register${window.location.search}`}
            className="font-bold text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300 hover:underline transition"
          >
            Register here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
