import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import usePlaces from '../hooks/usePlaces';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { History, Play, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { formatDate } from '../utils/helpers';


const SearchHistory = () => {
  const { history, loading, error, fetchHistory, setError } = usePlaces();
  const navigate = useNavigate();

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleRunAgain = (item) => {
    const params = new URLSearchParams();
    params.append('keyword', item.keyword);
    params.append('location', item.location);
    params.append('radius', item.radius);
    navigate(`/dashboard?${params.toString()}`);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'done':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 border border-emerald-200 text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-900/50 dark:text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Done
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 border border-red-200 text-red-700 dark:bg-red-950/20 dark:border-red-900/50 dark:text-red-400">
            <XCircle className="w-3.5 h-3.5" />
            Failed
          </span>
        );
      case 'processing':
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 border border-blue-200 text-blue-700 dark:bg-blue-950/20 dark:border-blue-900/50 dark:text-blue-400 animate-pulse">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Running
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 border border-slate-200 text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
          <History className="w-7 h-7 text-violet-600 dark:text-violet-400" />
          Prospecting Search History
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          A continuous record of Google Places scraping runs, API usage stats, and deduplication efficiency.
        </p>
      </div>

      {error && <ErrorMessage message={error} onClose={() => setError(null)} />}

      {loading && history.length === 0 ? (
        <LoadingSpinner message="Retrieving search query logs..." />
      ) : history.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center shadow-sm max-w-xl mx-auto">
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-full w-fit mx-auto text-slate-400 mb-4">
            <History className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-700 dark:text-slate-200">
            No history recorded yet
          </h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-sm mx-auto">
            You haven't run any prospecting scans. Head over to the Dashboard to search and build location intelligence lists.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">
                  <th className="py-4 px-6">Scouting Target</th>
                  <th className="py-4 px-6">Radius</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6">Stats (Total/New/Dup)</th>
                  <th className="py-4 px-6">Date Scanned</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-sm">
                {history.map((item) => (
                  <tr 
                    key={item._id}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors"
                  >
                    {/* Keyword & City */}
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-800 dark:text-slate-100">
                        {item.keyword}
                      </div>
                      <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                        {item.location}
                      </div>
                    </td>

                    {/* Radius */}
                    <td className="py-4 px-6 text-slate-600 dark:text-slate-300 font-medium">
                      {(item.radius / 1000).toFixed(1)} km
                    </td>

                    {/* Status */}
                    <td className="py-4 px-6">
                      {getStatusBadge(item.status)}
                    </td>

                    {/* Stats counts */}
                    <td className="py-4 px-6">
                      {item.status === 'done' ? (
                        <div className="flex flex-col gap-0.5">
                          <span className="font-bold text-slate-700 dark:text-slate-200">
                            {item.resultsCount} places total
                          </span>
                          <span className="text-xs text-slate-400 dark:text-slate-500">
                            {item.newCount} new / {item.duplicateCount} duplicates
                          </span>
                        </div>
                      ) : item.status === 'failed' ? (
                        <span className="text-xs text-red-500 font-medium max-w-[150px] block truncate" title={item.errorMessage}>
                          {item.errorMessage || 'Job failed'}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 dark:text-slate-500">Processing...</span>
                      )}
                    </td>

                    {/* Created Date */}
                    <td className="py-4 px-6 text-xs text-slate-500 dark:text-slate-400">
                      {formatDate(item.createdAt)}
                    </td>

                    {/* Run Again */}
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => handleRunAgain(item)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-violet-600 hover:text-white dark:text-violet-400 dark:hover:text-white hover:bg-violet-600 dark:hover:bg-violet-500 border border-violet-200 dark:border-violet-800 hover:border-violet-600 dark:hover:border-violet-500 rounded-xl transition duration-200 cursor-pointer"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>Run Again</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchHistory;
