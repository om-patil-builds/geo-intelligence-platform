import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Globe, Plus, Play, Sparkles, X, CheckCircle2, AlertCircle } from 'lucide-react';
import scrapingService from '../services/scrapingService';

const POPULAR_TOPICS = [
  'Gyms & Fitness',
  'Software Companies',
  'NGOs & Non-Profits',
  'Real Estate & Agents',
  'Restaurants & Cafes',
  'Healthcare & Clinics',
];

const AddToScrapingCampaignModal = ({ isOpen, onClose, places = [], onSuccess }) => {
  const navigate = useNavigate();

  const [mode, setMode] = useState('new'); // 'new' or 'existing'
  const [campaigns, setCampaigns] = useState([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);

  // Form states
  const [selectedCampaignId, setSelectedCampaignId] = useState('');
  const [name, setName] = useState('');
  const [topic, setTopic] = useState('');
  const [autoStart, setAutoStart] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Eligible places with websites
  const eligiblePlaces = places.filter((p) => Boolean(p.website));

  useEffect(() => {
    if (isOpen) {
      setErrorMsg('');
      loadCampaigns();
    }
  }, [isOpen]);

  const loadCampaigns = async () => {
    setLoadingCampaigns(true);
    try {
      const data = await scrapingService.getCampaigns();
      if (data.success) {
        setCampaigns(data.campaigns || []);
        if (data.campaigns?.length > 0) {
          setSelectedCampaignId(data.campaigns[0]._id);
        } else {
          setMode('new');
        }
      }
    } catch (err) {
      console.error('Failed to load campaigns:', err);
    } finally {
      setLoadingCampaigns(false);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (eligiblePlaces.length === 0) {
      setErrorMsg('None of the selected leads have websites available.');
      return;
    }

    setSubmitting(true);
    try {
      let targetCampaignId = selectedCampaignId;

      if (mode === 'new') {
        const cleanName = name.trim();
        const cleanTopic = topic.trim();

        if (!cleanName || !cleanTopic) {
          setErrorMsg('Please specify both a campaign name and a topic/category.');
          setSubmitting(false);
          return;
        }

        const createRes = await scrapingService.createCampaign({
          name: cleanName,
          topic: cleanTopic,
          concurrency: 3,
        });

        if (!createRes.success || !createRes.campaign) {
          throw new Error(createRes.message || 'Failed to create campaign');
        }

        targetCampaignId = createRes.campaign._id;
      }

      if (!targetCampaignId) {
        setErrorMsg('Please select an existing campaign or create a new one.');
        setSubmitting(false);
        return;
      }

      // Add places to campaign
      const placeIds = eligiblePlaces.map((p) => p._id);
      const addRes = await scrapingService.addPlacesToCampaign(targetCampaignId, placeIds);

      // Auto-start if requested
      if (autoStart) {
        try {
          await scrapingService.startCampaign(targetCampaignId);
        } catch (startErr) {
          console.warn('Could not auto-start campaign:', startErr);
        }
      }

      if (onSuccess) onSuccess(addRes);
      onClose();
      navigate(`/scraping/${targetCampaignId}`);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to add places to campaign');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-7 overflow-hidden">
        {/* Glow Accent */}
        <div className="absolute -top-16 -right-16 h-36 w-36 rounded-full bg-violet-500/15 blur-2xl" />

        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-500/20">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                Add to Scraping Campaign
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Crawl websites to extract business emails from contact & about pages
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Lead Count Badge */}
        <div className="mt-5 p-3.5 rounded-2xl border border-violet-100 dark:border-violet-900/40 bg-violet-50/60 dark:bg-violet-950/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-violet-600 dark:text-violet-400" />
            <span className="text-xs font-semibold text-violet-950 dark:text-violet-200">
              Websites ready for scraping:
            </span>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-violet-600 text-white shadow-sm shadow-violet-500/20">
            {eligiblePlaces.length} websites
          </span>
        </div>

        {/* Mode Selector */}
        <div className="grid grid-cols-2 gap-2 mt-5 p-1 bg-slate-100 dark:bg-slate-800/60 rounded-2xl">
          <button
            type="button"
            onClick={() => setMode('new')}
            className={`py-2 text-xs font-bold rounded-xl transition ${
              mode === 'new'
                ? 'bg-white dark:bg-slate-900 text-violet-600 dark:text-violet-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Plus className="w-3.5 h-3.5 inline mr-1" />
            Create New Campaign
          </button>
          <button
            type="button"
            onClick={() => setMode('existing')}
            disabled={campaigns.length === 0}
            className={`py-2 text-xs font-bold rounded-xl transition ${
              mode === 'existing'
                ? 'bg-white dark:bg-slate-900 text-violet-600 dark:text-violet-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-40'
            }`}
          >
            Select Existing ({campaigns.length})
          </button>
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="mt-4 p-3 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {mode === 'new' ? (
            <>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Campaign Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Pune Gyms & Fitness Centers"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Category / Topic
                </label>
                <input
                  type="text"
                  required
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. Gyms, Software Companies, NGOs..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                />

                {/* Quick Topic Chips */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {POPULAR_TOPICS.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTopic(t)}
                      className={`text-[11px] px-2 py-1 rounded-lg border transition ${
                        topic === t
                          ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 font-bold'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Choose Campaign
              </label>
              <select
                value={selectedCampaignId}
                onChange={(e) => setSelectedCampaignId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                {campaigns.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name} ({c.topic}) — {c.stats?.totalWebsites || 0} websites, {c.stats?.emailsFoundCount || 0} emails
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Auto-start checkbox */}
          <label className="flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-300 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={autoStart}
              onChange={(e) => setAutoStart(e.target.checked)}
              className="rounded border-slate-300 text-violet-600 focus:ring-violet-500 h-4 w-4"
            />
            <span>Start scraping immediately after adding</span>
          </label>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || eligiblePlaces.length === 0}
              className="px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 rounded-xl shadow-md shadow-violet-500/25 transition disabled:opacity-50 flex items-center gap-1.5"
            >
              {submitting ? (
                <span>Adding Websites...</span>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Add {eligiblePlaces.length} Websites</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddToScrapingCampaignModal;
