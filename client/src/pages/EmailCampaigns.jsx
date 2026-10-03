import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Mail,
  Play,
  Pause,
  Trash2,
  Sparkles,
  Clock,
  AlertCircle,
  ArrowLeft,
  Plus,
  RefreshCw,
  Copy,
  Check,
  Building2,
  Send,
  Sliders,
  CheckCircle2,
  XCircle,
  FileEdit,
  Save,
  Loader2,
  X,
} from 'lucide-react';
import emailService from '../services/emailService';
import LoadingSpinner from '../components/LoadingSpinner';
import GmailSettingsModal from '../components/GmailSettingsModal';

const statusBadgeClasses = {
  sending:
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

const EmailCampaigns = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Campaign list state
  const [campaigns, setCampaigns] = useState([]);
  const [loadingList, setLoadingList] = useState(true);

  // Active campaign detail state
  const [activeCampaign, setActiveCampaign] = useState(null);
  const [targets, setTargets] = useState([]);
  const [targetFilter, setTargetFilter] = useState('all');
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(null);

  // Gmail OAuth Settings & Alerts
  const [gmailSettings, setGmailSettings] = useState(null);
  const [isGmailModalOpen, setIsGmailModalOpen] = useState(false);
  const [oauthBanner, setOauthBanner] = useState(null);

  // Template editing state
  const [isEditingTemplate, setIsEditingTemplate] = useState(false);
  const [subjectInput, setSubjectInput] = useState('');
  const [bodyInput, setBodyInput] = useState('');
  const [delayInput, setDelayInput] = useState(3);
  const [savingTemplate, setSavingTemplate] = useState(false);

  // Create Campaign modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [creatingCampaign, setCreatingCampaign] = useState(false);

  // Fetch Gmail OAuth account status
  const loadGmailSettings = useCallback(async () => {
    try {
      const data = await emailService.getConnectedAccount();
      if (data.success && data.account) {
        setGmailSettings({
          ...data.account,
          isConnected: data.connected && !data.hasInsufficientScopes,
          hasInsufficientScopes: Boolean(data.hasInsufficientScopes),
        });
      } else {
        setGmailSettings(null);
      }
    } catch (err) {
      console.error('Failed to load Gmail account:', err);
    }
  }, []);

  // Listen for Google OAuth redirect query params (?gmail_connected=true or ?gmail_error=...)
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const gmailConnected = searchParams.get('gmail_connected');
    const gmailError = searchParams.get('gmail_error');
    const emailParam = searchParams.get('email');

    if (gmailConnected === 'true') {
      setOauthBanner({
        type: 'success',
        message: `Google account ${emailParam ? `(${emailParam}) ` : ''}connected successfully via OAuth 2.0! Ready for Gmail API dispatch.`,
      });
      loadGmailSettings();

      searchParams.delete('gmail_connected');
      if (emailParam) searchParams.delete('email');
      const newQuery = searchParams.toString();
      const newUrl = window.location.pathname + (newQuery ? `?${newQuery}` : '');
      window.history.replaceState({}, '', newUrl);
    } else if (gmailError) {
      setOauthBanner({
        type: 'error',
        message: `Google authorization failed: ${decodeURIComponent(gmailError)}`,
      });

      searchParams.delete('gmail_error');
      const newQuery = searchParams.toString();
      const newUrl = window.location.pathname + (newQuery ? `?${newQuery}` : '');
      window.history.replaceState({}, '', newUrl);
    }
  }, [loadGmailSettings]);

  // Load campaigns list
  const loadCampaigns = useCallback(async () => {
    try {
      const data = await emailService.getCampaigns();
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
      const data = await emailService.getCampaign(campaignId, {
        status: status === 'all' ? undefined : status,
        limit: 100,
      });
      if (data.success) {
        setActiveCampaign(data.campaign);
        setTargets(data.targets || []);
        setSubjectInput(data.campaign.subject || '');
        setBodyInput(data.campaign.templateBody || '');
        setDelayInput(data.campaign.sendDelaySeconds || 3);
      }
    } catch (err) {
      console.error('Failed to load campaign detail:', err);
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  useEffect(() => {
    loadGmailSettings();
    loadCampaigns();
  }, [loadGmailSettings, loadCampaigns]);

  useEffect(() => {
    if (id) {
      loadCampaignDetail(id, targetFilter);
    } else {
      setActiveCampaign(null);
      setTargets([]);
    }
  }, [id, targetFilter, loadCampaignDetail]);

  const isCampaignSending = activeCampaign?.status === 'sending';

  // Subscribe to real-time SSE dispatch updates
  useEffect(() => {
    if (!id || !isCampaignSending) return;

    const unsubscribe = emailService.subscribeToProgress(
      id,
      (event) => {
        if (event.type === 'progress') {
          setActiveCampaign((prev) =>
            prev ? { ...prev, status: event.status, stats: event.stats } : prev
          );
          if (event.status === 'completed' || event.status === 'failed') {
            loadCampaignDetail(id, targetFilter);
            loadCampaigns();
          }
        }
      },
      () => {
        // Silently handled by polling fallback
      }
    );

    return () => unsubscribe();
  }, [id, isCampaignSending, targetFilter, loadCampaignDetail, loadCampaigns]);

  // Campaign controls
  const handleStart = async (campaignId) => {
    if (!gmailSettings?.isConnected) {
      setIsGmailModalOpen(true);
      return;
    }
    setActionLoading(true);
    try {
      const res = await emailService.startCampaign(campaignId);
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
      const res = await emailService.pauseCampaign(campaignId);
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
    if (!gmailSettings?.isConnected) {
      setIsGmailModalOpen(true);
      return;
    }
    setActionLoading(true);
    try {
      const res = await emailService.resumeCampaign(campaignId);
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
    if (!window.confirm('Are you sure you want to permanently delete this email campaign and all targets?')) {
      return;
    }
    setActionLoading(true);
    try {
      const res = await emailService.deleteCampaign(campaignId);
      if (res.success) {
        navigate('/email');
        loadCampaigns();
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to delete campaign');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveTemplate = async () => {
    if (!activeCampaign) return;
    setSavingTemplate(true);
    try {
      const res = await emailService.updateCampaign(activeCampaign._id, {
        subject: subjectInput.trim(),
        templateBody: bodyInput.trim(),
        sendDelaySeconds: Number(delayInput),
      });
      if (res.success) {
        setActiveCampaign(res.campaign);
        setIsEditingTemplate(false);
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to update email template');
    } finally {
      setSavingTemplate(false);
    }
  };

  const handleCreateCampaign = async (e) => {
    e.preventDefault();
    const cleanName = newName.trim();
    const cleanCategory = newCategory.trim();

    if (!cleanName || !cleanCategory) return;

    setCreatingCampaign(true);
    try {
      const res = await emailService.createCampaign({
        name: cleanName,
        category: cleanCategory,
        subject: 'Partnership Inquiry: collaboration with {businessName}',
        templateBody: 'Hi {businessName} Team,\n\nWe would love to discuss a potential partnership.\n\nBest regards,\n{senderName}',
      });

      if (res.success && res.campaign) {
        setIsCreateModalOpen(false);
        setNewName('');
        setNewCategory('');
        loadCampaigns();
        navigate(`/email/${res.campaign._id}`);
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to create campaign');
    } finally {
      setCreatingCampaign(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedEmail(text);
    setTimeout(() => setCopiedEmail(null), 2000);
  };

  // Target statistics
  const stats = activeCampaign?.stats || {
    totalEmails: 0,
    sentCount: 0,
    pendingCount: 0,
    sendingCount: 0,
    failedCount: 0,
  };

  const total = stats.totalEmails || 0;
  const processed = (stats.sentCount || 0) + (stats.failedCount || 0);
  const progressPercent = total > 0 ? Math.min(Math.round((processed / total) * 100), 100) : 0;

  return (
    <div className="space-y-6">
      {/* OAuth Redirect Notification Banner */}
      {oauthBanner && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between gap-3 text-xs font-semibold ${
            oauthBanner.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
              : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {oauthBanner.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />
            )}
            <span>{oauthBanner.message}</span>
          </div>
          <button
            onClick={() => setOauthBanner(null)}
            className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Banner: Gmail Sender Account Status */}
      <div className="p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          {gmailSettings?.picture ? (
            <img
              src={gmailSettings.picture}
              alt={gmailSettings.email}
              className="w-11 h-11 rounded-2xl border border-emerald-300 shadow-sm shrink-0"
            />
          ) : (
            <div className="p-3 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/20 shrink-0">
              <Mail className="w-5 h-5" />
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
                Gmail Sender Account:
              </h2>
              {gmailSettings?.hasInsufficientScopes ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-200 border border-amber-300 dark:border-amber-700 animate-pulse">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  Permission Missing: {gmailSettings.email}
                </span>
              ) : gmailSettings?.isConnected ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {gmailSettings.email}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  Not Connected
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {gmailSettings?.hasInsufficientScopes
                ? 'Google OAuth connected, but the "Send email on your behalf" permission was left unchecked. Re-authorize to enable dispatch.'
                : gmailSettings?.isConnected
                ? 'Connected via official Google OAuth 2.0 (Gmail REST API).'
                : 'Connect your Google account via OAuth 2.0 to enable direct email dispatch with high deliverability. No passwords required.'}
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsGmailModalOpen(true)}
          className="w-full sm:w-auto px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shrink-0"
        >
          <Sliders className="w-4 h-4 text-emerald-500" />
          <span>
            {gmailSettings?.hasInsufficientScopes
              ? 'Fix Send Permission'
              : gmailSettings?.isConnected
              ? 'Google Account'
              : 'Connect Gmail'}
          </span>
        </button>
      </div>

      {/* Main Campaign View */}
      {id && activeCampaign ? (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigate('/email')}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition cursor-pointer mr-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    All Campaigns
                  </button>
                  <span
                    className={`inline-block px-3 py-1 text-xs font-extrabold uppercase tracking-wider rounded-full border ${
                      statusBadgeClasses[activeCampaign.status] || statusBadgeClasses.draft
                    }`}
                  >
                    {activeCampaign.status}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {activeCampaign.category}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                  {activeCampaign.name}
                </h1>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                {activeCampaign.status === 'draft' && (
                  <button
                    onClick={() => handleStart(activeCampaign._id)}
                    disabled={actionLoading}
                    className="px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-xl shadow-md shadow-emerald-500/20 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Play className="w-4 h-4" />
                    <span>Launch Campaign</span>
                  </button>
                )}

                {activeCampaign.status === 'sending' && (
                  <button
                    onClick={() => handlePause(activeCampaign._id)}
                    disabled={actionLoading}
                    className="px-5 py-2.5 text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-950/60 border border-amber-200 dark:border-amber-800/60 rounded-xl transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Pause className="w-4 h-4" />
                    <span>Pause Sending</span>
                  </button>
                )}

                {activeCampaign.status === 'paused' && (
                  <button
                    onClick={() => handleResume(activeCampaign._id)}
                    disabled={actionLoading}
                    className="px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-xl shadow-md shadow-emerald-500/20 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Play className="w-4 h-4" />
                    <span>Resume Sending</span>
                  </button>
                )}

                <button
                  onClick={() => handleDelete(activeCampaign._id)}
                  disabled={actionLoading}
                  className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition cursor-pointer"
                  title="Delete campaign"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Live Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-600 dark:text-slate-300 flex items-center gap-2">
                  <Send className="w-3.5 h-3.5 text-emerald-500" />
                  Dispatch Progress: {processed} of {total} emails
                </span>
                <span className="text-emerald-600 dark:text-emerald-400 font-mono">
                  {progressPercent}%
                </span>
              </div>
              <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Stats Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800/80">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Total Recipients
                </p>
                <p className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-white">
                  {stats.totalEmails || 0}
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800/80">
                <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Successfully Sent
                </p>
                <p className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-white">
                  {stats.sentCount || 0}
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800/80">
                <p className="text-[11px] font-bold uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Pending In Queue
                </p>
                <p className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-white">
                  {stats.pendingCount || 0}
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800/80">
                <p className="text-[11px] font-bold uppercase tracking-wider text-red-500 flex items-center gap-1.5">
                  <XCircle className="w-3.5 h-3.5" />
                  Failed
                </p>
                <p className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-white">
                  {stats.failedCount || 0}
                </p>
              </div>
            </div>
          </div>

          {/* Email Template Config Card */}
          <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <FileEdit className="w-4 h-4 text-emerald-500" />
                  Email Template & Sequence Copy
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Personalize the subject line and message using dynamic tag variables.
                </p>
              </div>

              {!isEditingTemplate ? (
                <button
                  onClick={() => setIsEditingTemplate(true)}
                  disabled={activeCampaign.status === 'sending'}
                  className="px-3.5 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                >
                  <FileEdit className="w-3.5 h-3.5" />
                  <span>Edit Template</span>
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsEditingTemplate(false)}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveTemplate}
                    disabled={savingTemplate}
                    className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {savingTemplate ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    <span>Save</span>
                  </button>
                </div>
              )}
            </div>

            {isEditingTemplate ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Subject Line
                  </label>
                  <input
                    type="text"
                    value={subjectInput}
                    onChange={(e) => setSubjectInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Body Template
                    </label>
                    <span className="text-[11px] text-slate-400">
                      Available tags: &#123;businessName&#125;, &#123;website&#125;, &#123;recipientEmail&#125;, &#123;senderName&#125;
                    </span>
                  </div>
                  <textarea
                    rows={6}
                    value={bodyInput}
                    onChange={(e) => setBodyInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Throttle Delay Between Sends (seconds)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={delayInput}
                    onChange={(e) => setDelayInput(e.target.value)}
                    className="w-32 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm font-mono text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800/80">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Subject Line
                  </span>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    {activeCampaign.subject || 'No subject configured'}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800/80">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                    Email Body Preview
                  </span>
                  <p className="text-xs sm:text-sm font-mono text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                    {activeCampaign.templateBody || 'No template body configured'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Recipients Table */}
          <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-emerald-500" />
                  Target Recipients ({targets.length})
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Live delivery status and timestamp for each recipient in this campaign.
                </p>
              </div>

              {/* Filter Tabs */}
              <div className="flex flex-wrap gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs">
                {['all', 'sent', 'pending', 'failed'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setTargetFilter(st)}
                    className={`px-3 py-1 rounded-lg font-bold capitalize transition ${
                      targetFilter === st
                        ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {loadingDetail ? (
              <div className="py-12 flex justify-center">
                <LoadingSpinner message="Loading recipient leads..." />
              </div>
            ) : targets.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <Mail className="w-8 h-8 mx-auto mb-2 opacity-50 text-emerald-500" />
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  No recipients found in this filter
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Import leads from a website scraping campaign or dashboard search.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                      <th className="py-3 px-3">Business</th>
                      <th className="py-3 px-3">Recipient Email</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3">Dispatched At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {targets.map((target) => (
                      <tr key={target._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                          {target.businessName || 'Business Lead'}
                          {target.website && (
                            <span className="block text-[11px] font-normal text-slate-400 truncate max-w-[200px]">
                              {target.website}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <button
                            onClick={() => copyToClipboard(target.recipientEmail)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 font-mono text-slate-700 dark:text-slate-200 hover:text-emerald-600 transition"
                            title="Click to copy email"
                          >
                            <span>{target.recipientEmail}</span>
                            {copiedEmail === target.recipientEmail ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5 opacity-50" />
                            )}
                          </button>
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize border ${
                              statusBadgeClasses[target.status] || statusBadgeClasses.draft
                            }`}
                          >
                            {target.status}
                          </span>
                          {target.errorMessage && (
                            <p className="text-[10px] text-red-500 mt-1 max-w-[220px] truncate" title={target.errorMessage}>
                              {target.errorMessage}
                            </p>
                          )}
                        </td>
                        <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">
                          {target.sentAt ? new Date(target.sentAt).toLocaleString() : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Campaigns Index View */
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Send className="w-7 h-7 text-emerald-600" />
                Email Outreach Campaigns
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                Automate personalized cold email dispatches to scraped business leads using official Gmail API and Google OAuth 2.0.
              </p>
            </div>

            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-xl shadow-md shadow-emerald-500/20 transition flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>New Email Campaign</span>
            </button>
          </div>

          {loadingList ? (
            <div className="py-16 flex justify-center">
              <LoadingSpinner message="Loading outreach campaigns..." />
            </div>
          ) : campaigns.length === 0 ? (
            <div className="p-12 text-center rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
              <div className="h-16 w-16 mx-auto rounded-3xl bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600">
                <Mail className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  No Email Outreach Campaigns Yet
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                  Run a website scraping campaign to extract business email addresses, then transfer them into an outreach campaign for automated sending.
                </p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl shadow-md shadow-emerald-500/20"
              >
                Create Your First Campaign
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {campaigns.map((camp) => {
                const campStats = camp.stats || {};
                const campTotal = campStats.totalEmails || 0;
                const campSent = campStats.sentCount || 0;
                const percent = campTotal > 0 ? Math.round((campSent / campTotal) * 100) : 0;

                return (
                  <Link
                    key={camp._id}
                    to={`/email/${camp._id}`}
                    className="group block p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-emerald-500/50 dark:hover:border-emerald-500/50 transition-all duration-300 shadow-sm hover:shadow-lg hover:shadow-emerald-500/5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                            statusBadgeClasses[camp.status] || statusBadgeClasses.draft
                          }`}
                        >
                          {camp.status}
                        </span>
                        <h3 className="mt-2 text-base font-extrabold text-slate-900 dark:text-white group-hover:text-emerald-600 transition">
                          {camp.name}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {camp.category}
                        </p>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-emerald-500">
                        <Mail className="w-5 h-5" />
                      </div>
                    </div>

                    <div className="mt-5 space-y-2">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-slate-500">Delivery</span>
                        <span className="text-emerald-600">{percent}%</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                      <span>{campTotal} recipients</span>
                      <span className="font-bold text-emerald-600 group-hover:translate-x-0.5 transition">
                        Manage &rarr;
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Gmail Settings Modal */}
      <GmailSettingsModal
        isOpen={isGmailModalOpen}
        onClose={() => setIsGmailModalOpen(false)}
        onSettingsUpdated={(settings) => setGmailSettings(settings)}
      />

      {/* Create New Campaign Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-7 overflow-hidden">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-500/20">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                    Create Outreach Campaign
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Set up a new cold email campaign sequence.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCampaign} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Campaign Name
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Pune Tech Companies Sequence"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Industry / Category
                </label>
                <input
                  type="text"
                  required
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="e.g. Software, Gyms, Clinics..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingCampaign}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition disabled:opacity-50"
                >
                  {creatingCampaign ? 'Creating...' : 'Create Campaign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailCampaigns;
