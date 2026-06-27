import { useState } from 'react';
import { Search, MapPin, Compass, Sliders } from 'lucide-react';
import { DEFAULT_MAX_RESULTS } from '../utils/constants';

const SearchForm = ({ onSearch, loading, initialValues = {} }) => {
  const [keyword, setKeyword] = useState(initialValues.keyword || '');
  const [location, setLocation] = useState(initialValues.location || initialValues.city || '');
  const [radius, setRadius] = useState(initialValues.radius !== undefined ? initialValues.radius : '');
  const [error, setError] = useState('');
const [maxResults, setMaxResults] = useState(initialValues.maxResults !== undefined ? initialValues.maxResults : DEFAULT_MAX_RESULTS);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const cleanKeyword = keyword.trim();
    const cleanLocation = location.trim();

    if (!cleanKeyword) {
      setError('Keyword is required (e.g., Coffee, Hospital).');
      return;
    }

    if (!cleanLocation) {
      setError('Location / City is required (e.g., Seattle, London).');
      return;
    }

    if (radius !== '' && (isNaN(Number(radius)) || Number(radius) <= 0)) {
      setError('Radius must be a positive number.');
      return;
    }

    if (maxResults !== '' && (isNaN(Number(maxResults)) || Number(maxResults) <= 0)) {
      setError('Max results must be a positive number.');
      return;
    }

    onSearch({
      keyword: cleanKeyword,
      location: cleanLocation,
      radius: radius !== '' ? Number(radius) : undefined,
      maxResults: maxResults !== '' ? Number(maxResults) : undefined
    });
  };

  return (
    <form 
      onSubmit={handleSubmit} 
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm transition-all"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Keyword Field */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
            Keyword / Business Type
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="e.g. coffee, dentist, gym"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              disabled={loading}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 text-slate-950 dark:text-slate-50 border border-slate-200 dark:border-slate-800 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 rounded-xl outline-none transition text-sm"
            />
          </div>
        </div>

        {/* Location / City Field */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
            City / Location
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
              <MapPin className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="e.g. New York, London"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              disabled={loading}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 text-slate-950 dark:text-slate-50 border border-slate-200 dark:border-slate-800 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 rounded-xl outline-none transition text-sm"
            />
          </div>
        </div>

        {/* Radius Field */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
            Search Radius (meters) <span className="text-slate-400 dark:text-slate-500 lowercase font-normal">(optional)</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
              <Compass className="w-4 h-4" />
            </div>
            <input
              type="number"
              placeholder="e.g. 5000, 10000 (default: none)"
              value={radius}
              onChange={(e) => setRadius(e.target.value)}
              disabled={loading}
              min="500"
              max="50000"
              step="500"
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 text-slate-950 dark:text-slate-50 border border-slate-200 dark:border-slate-800 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 rounded-xl outline-none transition text-sm"
            />
          </div>
        </div>

        {/* Max Limit Field */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
            Max Results Limit
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
              <Sliders className="w-4 h-4" />
            </div>
            <input
              type="number"
              placeholder="max 60"
              value={maxResults}
              onChange={(e) => setMaxResults(e.target.value)}
              disabled={loading}
              min="1"
              max="60"
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 text-slate-950 dark:text-slate-50 border border-slate-200 dark:border-slate-800 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 rounded-xl outline-none transition text-sm"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-4 text-xs font-medium text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="mt-5 flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="w-full sm:w-auto px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 rounded-xl shadow-md shadow-violet-500/20 hover:shadow-violet-500/30 transition duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              <span>Searching...</span>
            </>
          ) : (
            <>
              <Search className="w-4 h-4" />
              <span>Explore Places</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default SearchForm;
