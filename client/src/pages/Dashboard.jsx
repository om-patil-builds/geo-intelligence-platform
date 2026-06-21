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
import LeadTierFilter from '../components/LeadTierFilter';
import {
  Activity,
  BarChart3,
  Building2,
  Crosshair,
  Database,
  LayoutGrid,
  MapPinned,
  Radar,
  Route,
  Search,
  ShieldCheck,
  Sparkles,
  Target
} from 'lucide-react';

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
    const maxResults = params.get('maxResults');

    if (keyword && location) {
      return {
        keyword,
        location,
        radius: radius ? Number(radius) : undefined,
        maxResults: maxResults ? Number(maxResults) : undefined
      };
    }
    return null;
  });

  const [deletingId, setDeletingId] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [selectedTier, setSelectedTier] = useState('all');
  const [displayedCount, setDisplayedCount] = useState(20);

  const activeLocation = currentFilters?.location || currentFilters?.city || 'No active market';
  const activeKeyword = currentFilters?.keyword || 'Select a segment';

  // Filter places based on selected tier
  const filteredPlaces = selectedTier === 'all' 
    ? places 
    : places.filter(place => place.leadTier === selectedTier);

  // Paginate filtered places - show only the first displayedCount records
  const paginatedPlaces = filteredPlaces.slice(0, displayedCount);
  const leadCaptureRate = searchStats.totalPlaces > 0
    ? Math.round((Math.max(searchStats.newCount || 0, 0) / searchStats.totalPlaces) * 100)
    : 0;
  const duplicateRate = searchStats.totalPlaces > 0
    ? Math.round((Math.max(searchStats.duplicateCount || 0, 0) / (searchStats.totalPlaces + (searchStats.duplicateCount || 0))) * 100)
    : 0;

  // Run search once on mount if filters are parsed from URL query
  useEffect(() => {
    if (currentFilters) {
      search(
        currentFilters.keyword,
        currentFilters.location,
        currentFilters.radius,
        currentFilters.maxResults
      );
      setSearchParams({}, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const handleSearchSubmit = async (formData) => {
    setSuccessMsg('');
    setSelectedTier('all'); // Reset filter when new search is performed
    setDisplayedCount(20); // Reset pagination when new search is performed
    setCurrentFilters(formData);
    await search(formData.keyword, formData.location, formData.radius, formData.maxResults);
  };

  const handleViewMore = () => {
    setDisplayedCount(prev => prev + 20);
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

  const workflowSteps = [
    { icon: Search, title: 'Search', copy: 'Find local businesses by keyword and market.' },
    { icon: Sparkles, title: 'Score', copy: 'Review ratings, contacts, tiers, and AI insight.' },
    { icon: Route, title: 'Export', copy: 'Download clean lead data for outreach.' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(124,58,237,0.14),transparent_30%),radial-gradient(circle_at_78%_12%,rgba(6,182,212,0.12),transparent_26%),linear-gradient(135deg,rgba(248,250,252,0.92),rgba(255,255,255,0.72))] dark:bg-[radial-gradient(circle_at_20%_20%,rgba(124,58,237,0.18),transparent_30%),radial-gradient(circle_at_78%_12%,rgba(6,182,212,0.12),transparent_26%),linear-gradient(135deg,rgba(15,23,42,0.92),rgba(15,23,42,0.72))]" />
        <div className="relative grid grid-cols-1 lg:grid-cols-[1.25fr_0.75fr] gap-8 p-6 sm:p-8">
          <div className="flex flex-col justify-between gap-8">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 dark:border-violet-900/60 bg-violet-50/80 dark:bg-violet-950/30 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-violet-700 dark:text-violet-300">
                <Activity className="w-3.5 h-3.5" />
                Live prospecting workspace
              </div>
              <h1 className="mt-4 text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-950 dark:text-white">
                Location Intelligence Dashboard
              </h1>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 mt-3 max-w-2xl leading-relaxed">
                Search market areas, score local businesses, remove duplicates, and export clean lead intelligence from one focused command center.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-950/35 p-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  <Target className="w-4 h-4 text-violet-500" />
                  Segment
                </div>
                <p className="mt-2 text-sm font-bold text-slate-900 dark:text-white truncate" title={activeKeyword}>
                  {activeKeyword}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-950/35 p-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  <MapPinned className="w-4 h-4 text-cyan-500" />
                  Market
                </div>
                <p className="mt-2 text-sm font-bold text-slate-900 dark:text-white truncate" title={activeLocation}>
                  {activeLocation}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-950/35 p-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  Data Quality
                </div>
                <p className="mt-2 text-sm font-bold text-slate-900 dark:text-white">
                  {searchStats.totalPlaces > 0 ? `${100 - duplicateRate}% clean` : 'Ready'}
                </p>
              </div>
            </div>
          </div>

          <div className="relative min-h-[260px] rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-950 text-white overflow-hidden shadow-2xl shadow-slate-300/40 dark:shadow-slate-950/40">
            <div className="absolute inset-0 opacity-50 bg-[linear-gradient(rgba(148,163,184,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.12)_1px,transparent_1px)] bg-[size:28px_28px]" />
            <div className="absolute -top-16 -right-12 h-44 w-44 rounded-full bg-cyan-400/20 blur-2xl" />
            <div className="absolute -bottom-20 -left-16 h-52 w-52 rounded-full bg-violet-500/25 blur-2xl" />
            <div className="relative h-full p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Coverage Scan</p>
                  <p className="mt-1 text-lg font-extrabold">{activeLocation}</p>
                </div>
                <div className="h-11 w-11 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center">
                  <Radar className="w-5 h-5 text-cyan-300" />
                </div>
              </div>

              <div className="relative mx-auto my-2 h-32 w-32 rounded-full border border-cyan-300/40 flex items-center justify-center">
                <div className="absolute inset-4 rounded-full border border-violet-300/30" />
                <div className="absolute inset-9 rounded-full bg-cyan-300/20 border border-cyan-200/50" />
                <div className="absolute left-4 top-9 h-2.5 w-2.5 rounded-full bg-emerald-300 shadow-lg shadow-emerald-300/40" />
                <div className="absolute right-7 top-5 h-2 w-2 rounded-full bg-amber-300 shadow-lg shadow-amber-300/40" />
                <div className="absolute right-8 bottom-8 h-3 w-3 rounded-full bg-violet-300 shadow-lg shadow-violet-300/40" />
                <Crosshair className="relative w-7 h-7 text-white" />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-2xl bg-white/10 border border-white/10 p-3">
                  <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Leads</p>
                  <p className="text-lg font-extrabold">{searchStats.totalPlaces}</p>
                </div>
                <div className="rounded-2xl bg-white/10 border border-white/10 p-3">
                  <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">New</p>
                  <p className="text-lg font-extrabold">{leadCaptureRate}%</p>
                </div>
                <div className="rounded-2xl bg-white/10 border border-white/10 p-3">
                  <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Calls</p>
                  <p className="text-lg font-extrabold">{searchStats.apiCalls || 0}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Search Component */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-2 shadow-sm">
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
                newCount={searchStats.newCount}
                apiCalls={searchStats.apiCalls}
              />

              {/* Data Export Options */}
              <ExportButton filters={currentFilters || {}} />

              {/* Results Table Section */}
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-violet-500" />
                      Discovered Leads ({filteredPlaces.length})
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Ranked place records with contact coverage, ratings, lead tier, and AI summaries.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-1.5 font-semibold">
                      <BarChart3 className="w-3.5 h-3.5 text-cyan-500" />
                      {leadCaptureRate}% new lead rate
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-1.5 font-semibold">
                      <Database className="w-3.5 h-3.5 text-emerald-500" />
                      {searchStats.duplicateCount || 0} duplicates filtered
                    </span>
                  </div>
                </div>

                {/* Lead Tier Filter */}
                <LeadTierFilter 
                  selectedTier={selectedTier}
                  onTierChange={setSelectedTier}
                />

                <ResultsTable
                  places={paginatedPlaces}
                  onDelete={handleDelete}
                  deletingId={deletingId}
                />

                {/* View More Button */}
                {filteredPlaces.length > displayedCount && (
                  <div className="flex justify-center mt-6">
                    <button
                      onClick={handleViewMore}
                      className="px-8 py-3 text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 rounded-xl shadow-md shadow-violet-500/20 hover:shadow-violet-500/30 transition duration-300 cursor-pointer"
                    >
                      View More Places ({filteredPlaces.length - displayedCount} remaining)
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Empty State */
            !currentFilters ? (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 sm:p-12 shadow-sm overflow-hidden relative">
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-violet-500 via-cyan-400 to-emerald-400" />
                <div className="grid grid-cols-1 lg:grid-cols-[0.8fr_1.2fr] gap-8 items-center">
                  <div className="text-center lg:text-left">
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl w-fit mx-auto lg:mx-0 text-violet-500 mb-4">
                      <LayoutGrid className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-extrabold text-slate-800 dark:text-slate-100">
                      Ready to scout a market?
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-md mx-auto lg:mx-0">
                      Use the prospecting form above to search a business category, inspect lead quality, clean duplicates, and export the final list.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {workflowSteps.map((item) => {
                      const Icon = item.icon;
                      return (
                        <div key={item.title} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/35 p-5">
                          <div className="h-10 w-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-violet-500">
                            <Icon className="w-5 h-5" />
                          </div>
                          <h4 className="mt-4 text-sm font-bold text-slate-900 dark:text-white">{item.title}</h4>
                          <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{item.copy}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
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
