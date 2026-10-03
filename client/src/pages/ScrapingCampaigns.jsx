import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Globe,
  Play,
  Pause,
  Trash2,
  Mail,
  Sparkles,
  Clock,
  AlertCircle,
  ArrowLeft,
  ExternalLink,
  Plus,
  RefreshCw,
  Copy,
  Check,
  Building2,
} from 'lucide-react';
import scrapingService from '../services/scrapingService';
import LoadingSpinner from '../components/LoadingSpinner';
import AddToEmailCampaignModal from '../components/AddToEmailCampaignModal';

const statusBadgeClasses = {
  running:
    'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60',
  paused:
    'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60',
  completed:
    'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/60',
  draft:
    'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
  failed:
    'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800/60',
};

const ScrapingCampaigns = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Campaign list state
  const [campaigns, setCampaigns] = useState([]);
  const [loadingList, setLoadingList] = useState(true);

  // Active campaign detail state (when :id is present)
  const [activeCampaign, setActiveCampaign] = useState(null);
  const [targets, setTargets] = useState([]);
  const [targetFilter, setTargetFilter] = useState('all');
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(null);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);

  // Load campaigns list
  const loadCampaigns = useCallback(async () => {
    try {
      const data = await scrapingService.getCampaigns();
      if (data.success) {
        setCampaigns(data.campaigns || []);
      }
    } catch (err) {
      console.error('Failed to load campaigns:', err);
    } finally {
      setLoadingList(false);
    }
  }, []);

  // Load active campaign detail and targets
  const loadCampaignDetail = useCallback(async (campaignId, status = 'all') => {
    setLoadingDetail(true);
    try {
      const data = await scrapingService.getCampaign(campaignId, {
        status: status === 'all' ? undefined : status,
        limit: 100,
      });
      if (data.success) {
        setActiveCampaign(data.campaign);
        setTargets(data.targets || []);
      }
    } catch (err) {
      console.error('Failed to load campaign detail:', err);
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  useEffect(() => {
    loadCampaigns();
  }, [loadCampaigns]);

  useEffect(() => {
    if (id) {
      loadCampaignDetail(id, targetFilter);
    } else {
      setActiveCampaign(null);
      setTargets([]);
    }
  }, [id, targetFilter, loadCampaignDetail]);

  const isCampaignRunning = activeCampaign?.status === 'running';

  // Subscribe to real-time updates when viewing a running campaign
  useEffect(() => {
    if (!id || !isCampaignRunning) return;

    const unsubscribe = scrapingService.subscribeToProgress(
      id,
      (event) => {
        if (event.type === 'progress') {
          setActiveCampaign((prev) =>
            prev ? { ...prev, status: event.status, stats: event.stats } : prev
          );

          // Live update table rows for recently scraped websites
          if (event.recentActivity && Array.isArray(event.recentActivity)) {
            setTargets((prevTargets) => {
              if (!prevTargets || prevTargets.length === 0) return prevTargets;
              const activityMap = new Map(
                event.recentActivity.map((a) => [a._id || a.websiteUrl, a])
              );
              return prevTargets.map((target) => {
                const updated = activityMap.get(target._id) || activityMap.get(target.websiteUrl);
                if (updated) {
                  return {
                    ...target,
                    status: updated.status || target.status,
                    emails: updated.emails || target.emails,
                    errorMessage: updated.errorMessage || target.errorMessage,
                  };
                }
                return target;
              });
            });
          }

          // If status transitioned to completed or failed
          if (event.status === 'completed' || event.status === 'failed') {
            loadCampaignDetail(id, targetFilter);
            loadCampaigns();
          }
        }
      },
      () => {
        // Handled silently by service fallback
      }
    );

    return () => unsubscribe();
  }, [id, isCampaignRunning, targetFilter, loadCampaignDetail, loadCampaigns]);

  // Campaign playback controls
  const handleStart = async (campaignId) => {
    setActionLoading(true);
    try {
      const res = await scrapingService.startCampaign(campaignId);
      if (res.success) {
        setActiveCampaign(res.campaign);
        loadCampaigns();
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to start campaign');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePause = async (campaignId) => {
    setActionLoading(true);
    try {
      const res = await scrapingService.pauseCampaign(campaignId);
      if (res.success) {
        setActiveCampaign(res.campaign);
        loadCampaigns();
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to pause campaign');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResume = async (campaignId) => {
    setActionLoading(true);
    try {
      const res = await scrapingService.resumeCampaign(campaignId);
      if (res.success) {
        setActiveCampaign(res.campaign);
        loadCampaigns();
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to resume campaign');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (campaignId) => {
    if (!window.confirm('Are you sure you want to delete this campaign and all scraped leads?')) {
      return;
    }
    setActionLoading(true);
    try {
      const res = await scrapingService.deleteCampaign(campaignId);
      if (res.success) {
        navigate('/scraping');
        loadCampaigns();
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to delete campaign');
    } finally {
      setActionLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedEmail(text);
    setTimeout(() => setCopiedEmail(null), 2000);
  };

  // If viewing campaign detail
  if (id) {
    if (loadingDetail && !activeCampaign) {
      return (
        <div className="py-20 flex justify-center">
          <LoadingSpinner message="Loading campaign intelligence..." />
        </div>
      );
    }

    if (!activeCampaign) {
      return (
        <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8">
          <AlertCircle className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Campaign Not Found</h2>
          <p className="text-xs text-slate-500 mt-1">This campaign may have been removed.</p>
          <Link
            to="/scraping"
            className="inline-flex items-center gap-1.5 mt-4 text-xs font-bold text-violet-600 dark:text-violet-400 hover:underline"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to campaigns
          </Link>
        </div>
      );
    }

    const stats = activeCampaign.stats || {};
    const total = stats.totalWebsites || 0;
    const processed = (stats.scrapedCount || 0) + (stats.failedCount || 0);
    const progressPercent = total > 0 ? Math.min(Math.round((processed / total) * 100), 100) : 0;

    return (
      <div className="space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            to="/scraping"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>All Scraping Campaigns</span>
          </Link>

          <button
            onClick={() => loadCampaignDetail(id, targetFilter)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>

        {/* Campaign Header & Controls */}
        <section className="relative overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm">
          <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 via-cyan-500/5 to-transparent pointer-events-none" />

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                    statusBadgeClasses[activeCampaign.status] || statusBadgeClasses.draft
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
                  {activeCampaign.status}
                </span>

                <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {activeCampaign.topic}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 dark:text-white mt-3">
                {activeCampaign.name}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                Automated email extractor scraping business homepages and contact pages.
              </p>
            </div>

            {/* Playback Controls */}
            <div className="flex flex-wrap items-center gap-2.5">
              {activeCampaign.status === 'running' ? (
                <button
                  onClick={() => handlePause(activeCampaign._id)}
                  disabled={actionLoading}
                  className="px-4 py-2.5 rounded-xl font-bold text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/50 transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Pause className="w-4 h-4 fill-current" />
                  <span>Pause Scraping</span>
                </button>
              ) : activeCampaign.status === 'paused' ? (
                <button
                  onClick={() => handleResume(activeCampaign._id)}
                  disabled={actionLoading}
                  className="px-4 py-2.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 transition flex items-center gap-1.5 shadow-md shadow-emerald-500/20 cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Resume Scraping</span>
                </button>
              ) : (
                <button
                  onClick={() => handleStart(activeCampaign._id)}
                  disabled={actionLoading || total === 0}
                  className="px-4 py-2.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 transition flex items-center gap-1.5 shadow-md shadow-violet-500/20 disabled:opacity-50 cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Start Scraping</span>
                </button>
              )}

              <button
                onClick={() => handleDelete(activeCampaign._id)}
                disabled={actionLoading}
                className="p-2.5 rounded-xl text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition border border-slate-200 dark:border-slate-800"
                title="Delete Campaign"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Real-time Progress Bar */}
          <div className="mt-8 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-600 dark:text-slate-400">
                Live Crawl Progress ({processed} of {total} websites)
              </span>
              <span className="text-violet-600 dark:text-violet-400 font-extrabold">
                {progressPercent}% Complete
              </span>
            </div>
            <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5">
              <div
                className="h-full bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </section>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
              <Globe className="w-4 h-4 text-violet-500" />
              Total Websites
            </div>
            <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              {stats.totalWebsites || 0}
            </p>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              Emails Discovered
            </div>
            <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {stats.emailsFoundCount || 0}
            </p>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
              <Clock className="w-4 h-4 text-cyan-500" />
              Pending in Queue
            </div>
            <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              {stats.pendingCount || 0}
            </p>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              Failed / Inaccessible
            </div>
            <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              {stats.failedCount || 0}
            </p>
          </div>
        </div>

        {/* Transition Callout: Ready for Email Outreach */}
        {(stats.emailsFoundCount || 0) > 0 && (
          <div className="p-5 rounded-3xl border border-emerald-200 dark:border-emerald-900/60 bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 dark:from-emerald-950/30 dark:via-teal-950/20 dark:to-cyan-950/20 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-500/20">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-extrabold text-slate-900 dark:text-white">
                  {stats.emailsFoundCount} Verified Email Leads Discovered!
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  These verified email leads can now be added to an email outreach campaign for automated sending.
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsEmailModalOpen(true)}
              className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-xl shadow-md shadow-emerald-500/20 transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Mail className="w-4 h-4" />
              <span>Add {stats.emailsFoundCount} Leads to Email Campaign</span>
            </button>
          </div>
        )}

        {/* Targets Table Section */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Building2 className="w-4 h-4 text-violet-500" />
                Target Websites ({targets.length})
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Live status and discovered emails for each website in this campaign.
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs">
              {['all', 'scraped', 'pending', 'failed'].map((st) => (
                <button
                  key={st}
                  onClick={() => setTargetFilter(st)}
                  className={`px-3 py-1 rounded-lg font-bold capitalize transition ${
                    targetFilter === st
                      ? 'bg-white dark:bg-slate-900 text-violet-600 dark:text-violet-400 shadow-sm'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {targets.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No targets found matching the selected filter.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="py-3 px-3">Business</th>
                    <th className="py-3 px-3">Website</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Discovered Emails</th>
                    <th className="py-3 px-3 text-right">Pages Crawled</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {targets.map((target) => (
                    <tr key={target._id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition">
                      <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                        {target.businessName}
                      </td>
                      <td className="py-3 px-3">
                        <a
                          href={target.websiteUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-violet-600 dark:text-violet-400 hover:underline max-w-[200px] truncate"
                        >
                          <span className="truncate">{target.normalizedDomain}</span>
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </a>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                            statusBadgeClasses[target.status] || statusBadgeClasses.draft
                          }`}
                        >
                          {target.status}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        {target.emails && target.emails.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {target.emails.map((e, idx) => {
                              const emailStr = typeof e === 'string' ? e : e.email;
                              return (
                                <span
                                  key={idx}
                                  onClick={() => copyToClipboard(emailStr)}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[11px] font-mono font-medium hover:border-emerald-400 cursor-pointer transition"
                                  title="Click to copy email"
                                >
                                  {emailStr}
                                  {copiedEmail === emailStr ? (
                                    <Check className="w-3 h-3 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-3 h-3 opacity-50" />
                                  )}
                                </span>
                              );
                            })}
                          </div>
                        ) : target.status === 'scraped' ? (
                          <span className="text-[11px] text-slate-400 italic">No email found</span>
                        ) : target.errorMessage ? (
                          <span className="text-[11px] text-red-500 truncate max-w-[220px]" title={target.errorMessage}>
                            {target.errorMessage}
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-500">
                        {target.pagesScanned?.length || 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Add To Email Campaign Modal */}
        <AddToEmailCampaignModal
          isOpen={isEmailModalOpen}
          onClose={() => setIsEmailModalOpen(false)}
          scrapingCampaignId={activeCampaign?._id}
          leadsCount={activeCampaign?.stats?.emailsFoundCount || 0}
          defaultName={activeCampaign ? `${activeCampaign.name} Outreach` : ''}
          defaultCategory={activeCampaign?.topic || ''}
        />
      </div>
    );
  }

  // List View (All Campaigns)
  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 via-cyan-500/5 to-transparent pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 dark:border-violet-900/60 bg-violet-50 dark:bg-violet-950/30 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-violet-700 dark:text-violet-300">
              <Globe className="w-3.5 h-3.5" />
              Automated Web Scraper Engine
            </div>
            <h1 className="text-3xl font-extrabold text-slate-950 dark:text-white mt-3">
              Website Scraping Campaigns
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
              Crawl business websites discovered from Google Places to extract contact & about page emails with automatic background queue execution.
            </p>
          </div>

          <Link
            to="/dashboard"
            className="self-start sm:self-auto px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 shadow-md shadow-violet-500/25 transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Find Leads to Scrape</span>
          </Link>
        </div>
      </section>

      {/* Campaigns Grid */}
      {loadingList ? (
        <div className="py-20 flex justify-center">
          <LoadingSpinner message="Loading your scraping campaigns..." />
        </div>
      ) : campaigns.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-violet-50 dark:bg-violet-950/50 border border-violet-100 dark:border-violet-900/50 flex items-center justify-center mx-auto text-violet-600 dark:text-violet-400 mb-4">
            <Globe className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
            No Scraping Campaigns Yet
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-2 leading-relaxed">
            Search for local businesses in the Dashboard, then click &quot;Scrape Emails&quot; on the search results to create your first website scraping campaign.
          </p>
          <Link
            to="/dashboard"
            className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 shadow-md shadow-violet-500/25 transition"
          >
            <span>Start Market Search</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {campaigns.map((c) => {
            const stats = c.stats || {};
            const total = stats.totalWebsites || 0;
            const processed = (stats.scrapedCount || 0) + (stats.failedCount || 0);
            const progressPercent =
              total > 0 ? Math.min(Math.round((processed / total) * 100), 100) : 0;

            return (
              <div
                key={c._id}
                onClick={() => navigate(`/scraping/${c._id}`)}
                className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm hover:shadow-md hover:border-violet-300 dark:hover:border-violet-800/80 transition cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {c.topic}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                        statusBadgeClasses[c.status] || statusBadgeClasses.draft
                      }`}
                    >
                      {c.status}
                    </span>
                  </div>

                  <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 transition">
                    {c.name}
                  </h3>

                  {/* Progress bar */}
                  <div className="mt-4 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                      <span>{progressPercent}% scraped</span>
                      <span>
                        {processed}/{total} websites
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-violet-600 to-cyan-500 rounded-full"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
                    <Sparkles className="w-4 h-4" />
                    <span>{stats.emailsFoundCount || 0} emails found</span>
                  </div>
                  <span className="text-violet-600 dark:text-violet-400 font-bold group-hover:translate-x-0.5 transition">
                    View &rarr;
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add To Email Campaign Modal */}
      <AddToEmailCampaignModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        scrapingCampaignId={activeCampaign?._id}
        leadsCount={activeCampaign?.stats?.emailsFoundCount || 0}
        defaultName={activeCampaign ? `${activeCampaign.name} Outreach` : ''}
        defaultCategory={activeCampaign?.topic || ''}
      />
    </div>
  );
};

export default ScrapingCampaigns;
