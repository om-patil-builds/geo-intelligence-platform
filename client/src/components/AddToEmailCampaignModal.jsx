import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Plus, Sparkles, X, AlertCircle, Loader2 } from 'lucide-react';
import emailService from '../services/emailService';

const DEFAULT_SUBJECT = 'Partnership inquiry: collaboration with {businessName}';
const DEFAULT_BODY = `Hi {businessName} Team,

I came across your website ({website}) and was really impressed by your services.

We help companies in your sector expand their local customer reach and streamline lead acquisition.

Would you be open to a brief 5-minute chat this week to explore potential synergies?

Best regards,
{senderName}`;

const AddToEmailCampaignModal = ({
  isOpen,
  onClose,
  scrapingCampaignId,
  leadsCount = 0,
  targetIds = [],
  onSuccess,
}) => {
  const navigate = useNavigate();

  const [mode, setMode] = useState('new'); // 'new' or 'existing'
  const [campaigns, setCampaigns] = useState([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);

  // Form states
  const [selectedCampaignId, setSelectedCampaignId] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [subject, setSubject] = useState(DEFAULT_SUBJECT);
  const [templateBody, setTemplateBody] = useState(DEFAULT_BODY);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const loadCampaigns = useCallback(async () => {
    setLoadingCampaigns(true);
    try {
      const data = await emailService.getCampaigns();
      if (data.success) {
        setCampaigns(data.campaigns || []);
        if (data.campaigns?.length > 0) {
          setSelectedCampaignId(data.campaigns[0]._id);
        } else {
          setMode('new');
        }
      }
    } catch (err) {
      console.error('Failed to load email campaigns:', err);
    } finally {
      setLoadingCampaigns(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadCampaigns();
    }
  }, [isOpen, loadCampaigns]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    setSubmitting(true);
    try {
      let targetCampaignId = selectedCampaignId;

      if (mode === 'new') {
        const cleanName = name.trim();
        const cleanCategory = category.trim();
        const cleanSubject = subject.trim();
        const cleanBody = templateBody.trim();

        if (!cleanName || !cleanCategory) {
          setErrorMsg('Please specify both a campaign name and category.');
          setSubmitting(false);
          return;
        }

        const createRes = await emailService.createCampaign({
          name: cleanName,
          category: cleanCategory,
          subject: cleanSubject || DEFAULT_SUBJECT,
          templateBody: cleanBody || DEFAULT_BODY,
          sendDelaySeconds: 3,
        });

        if (!createRes.success || !createRes.campaign) {
          throw new Error(createRes.message || 'Failed to create email campaign');
        }

        targetCampaignId = createRes.campaign._id;
      }

      if (!targetCampaignId) {
        setErrorMsg('Please select an existing campaign or create a new one.');
        setSubmitting(false);
        return;
      }

      // Import leads from scraping campaign into email campaign
      const importPayload = {};
      if (scrapingCampaignId) importPayload.scrapingCampaignId = scrapingCampaignId;
      if (Array.isArray(targetIds) && targetIds.length > 0) {
        importPayload.targetIds = targetIds;
      }

      const importRes = await emailService.importLeads(targetCampaignId, importPayload);

      if (onSuccess) onSuccess(importRes);
      onClose();
      navigate(`/email/${targetCampaignId}`);
    } catch (err) {
      setErrorMsg(
        err.response?.data?.message || err.message || 'Failed to import leads to email campaign'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-7 overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Glow Accent */}
        <div className="absolute -top-16 -right-16 h-36 w-36 rounded-full bg-emerald-500/15 blur-2xl" />

        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/20">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                Add to Email Outreach
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Send automated email sequences to {leadsCount} discovered lead(s).
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector */}
        <div className="grid grid-cols-2 gap-2 p-1.5 mt-5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl">
          <button
            type="button"
            onClick={() => setMode('new')}
            className={`py-2 text-xs font-bold rounded-xl transition ${
              mode === 'new'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Plus className="w-3.5 h-3.5 inline mr-1" />
            New Campaign
          </button>
          <button
            type="button"
            onClick={() => setMode('existing')}
            disabled={campaigns.length === 0}
            className={`py-2 text-xs font-bold rounded-xl transition ${
              mode === 'existing'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
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
                  placeholder="e.g. Pune Fitness Centers Outreach"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Industry / Category
                </label>
                <input
                  type="text"
                  required
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g. Gyms & Fitness, Real Estate..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Email Subject Line
                </label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Template Body
                  </label>
                  <span className="text-[10px] text-slate-400">
                    Tags: &#123;businessName&#125;, &#123;website&#125;, &#123;senderName&#125;
                  </span>
                </div>
                <textarea
                  rows={5}
                  value={templateBody}
                  onChange={(e) => setTemplateBody(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed"
                />
              </div>
            </>
          ) : (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Target Campaign
              </label>
              {loadingCampaigns ? (
                <div className="p-4 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
                  <span>Loading campaigns...</span>
                </div>
              ) : (
                <select
                  value={selectedCampaignId}
                  onChange={(e) => setSelectedCampaignId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {campaigns.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name} ({c.stats?.totalEmails || 0} leads - {c.status})
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-xl shadow-md shadow-emerald-500/20 hover:shadow-emerald-500/30 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Importing Leads...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Import Leads & View Campaign</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddToEmailCampaignModal;
