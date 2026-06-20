import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import usePlaces from '../hooks/usePlaces';
import SearchForm from '../components/SearchForm';
import AnalyticsCards from '../components/AnalyticsCards';
import ExportButton from '../components/ExportButton';
import ResultsTable from '../components/ResultsTable';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import EmptyState from '../components/EmptyState';
import { LayoutGrid } from 'lucide-react';

const Dashboard = () => {
  const [, setSearchParams] = useSearchParams();

  const { 
    places, 
    loading, 
    error, 
    searchStats, 
    search, 
    deletePlace, 
    setError 
  } = usePlaces();

  // Lazy-initialize currentFilters from URL query parameters on mount to avoid state cascades
  const [currentFilters, setCurrentFilters] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const keyword = params.get('keyword');
    const location = params.get('location') || params.get('city');
    const radius = params.get('radius');

    if (keyword && location) {
      return {
        keyword,
        location,
        radius: radius ? Number(radius) : 10000
      };
    }
    return null;
  });

  const [deletingId, setDeletingId] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  // Run search once on mount if filters are parsed from URL query
  useEffect(() => {
    if (currentFilters) {
      search(currentFilters.keyword, currentFilters.location, currentFilters.radius);
      setSearchParams({}, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const handleSearchSubmit = async (formData) => {
    setSuccessMsg('');
    setCurrentFilters(formData);
    await search(formData.keyword, formData.location, formData.radius);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to remove this place from database?')) {
      setDeletingId(id);
      const res = await deletePlace(id);
      setDeletingId(null);
      if (res.success) {
        setSuccessMsg('Place removed successfully.');
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        alert(res.message || 'Failed to delete place');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
            <LayoutGrid className="w-7 h-7 text-violet-600 dark:text-violet-400" />
            Location Intelligence Dashboard
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time business listing evaluation, lead scoring, and automated duplication cleaning.
          </p>
        </div>
      </div>

      {/* Main Search Component */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-0 shadow-sm">
        <SearchForm 
          onSearch={handleSearchSubmit} 
          loading={loading} 
          initialValues={currentFilters || {}} 
        />
      </div>

      {/* Success notification banner */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 dark:bg-emerald-950/30 dark:border-emerald-900/50 dark:text-emerald-300 rounded-xl text-sm font-semibold">
          {successMsg}
        </div>
      )}

      {/* Error State */}
      {error && <ErrorMessage message={error} onClose={() => setError(null)} />}

      {/* Loading Spinner */}
      {loading && <LoadingSpinner message="Querying places and checking duplicates..." />}

      {/* Main dashboard data sections */}
      {!loading && (
        <>
          {places.length > 0 ? (
            <div>
              {/* Analytics Summary */}
              <AnalyticsCards 
                total={searchStats.totalPlaces} 
                averageRating={searchStats.avgRating} 
                duplicatesRemoved={searchStats.duplicateCount} 
              />

              {/* Data Export Options */}
              <ExportButton filters={currentFilters || {}} />

              {/* Results Table Section */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Discovered Leads ({places.length})
                  </h3>
                </div>
                <ResultsTable 
                  places={places} 
                  onDelete={handleDelete} 
                  deletingId={deletingId} 
                />
              </div>
            </div>
          ) : (
            /* Empty State */
            !currentFilters ? (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center shadow-sm">
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-full w-fit mx-auto text-slate-400 mb-4">
                  <LayoutGrid className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-slate-700 dark:text-slate-200">
                  Ready to scout?
                </h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-sm mx-auto">
                  Use the prospecting form above to search for target business categories, filter duplicates, and assess leads.
                </p>
              </div>
            ) : (
              <EmptyState />
            )
          )}
        </>
      )}
    </div>
  );
};

export default Dashboard;
