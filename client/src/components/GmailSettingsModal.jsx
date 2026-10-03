import { useState, useEffect, useCallback } from 'react';
import { Mail, Key, ShieldCheck, CheckCircle2, AlertCircle, X, Loader2, Unlink } from 'lucide-react';
import emailService from '../services/emailService';

const GmailSettingsModal = ({ isOpen, onClose, onSettingsUpdated }) => {
  const [email, setEmail] = useState('');
  const [appPassword, setAppPassword] = useState('');
  const [senderName, setSenderName] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await emailService.getGmailSettings();
      if (res.success && res.gmailSettings) {
        setEmail(res.gmailSettings.email || '');
        setSenderName(res.gmailSettings.senderName || '');
        setIsConnected(Boolean(res.gmailSettings.isConnected));
      }
    } catch (err) {
      console.error('Failed to load Gmail settings:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchSettings();
    }
  }, [isOpen, fetchSettings]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = appPassword.trim().replace(/\s+/g, '');
    const cleanSender = senderName.trim();

    if (!cleanEmail || !cleanPassword) {
      setErrorMsg('Both Gmail address and 16-character Google App Password are required.');
      return;
    }

    setSaving(true);
    try {
      const res = await emailService.updateGmailSettings({
        email: cleanEmail,
        appPassword: cleanPassword,
        senderName: cleanSender,
      });

      if (res.success) {
        setIsConnected(true);
        setAppPassword(''); // Clear password from input field
        setSuccessMsg('Gmail connected and verified successfully!');
        if (onSettingsUpdated) onSettingsUpdated(res.gmailSettings);
        setTimeout(() => {
          setSuccessMsg('');
          onClose();
        }, 1500);
      } else {
        setErrorMsg(res.message || 'Failed to verify Gmail connection');
      }
    } catch (err) {
      setErrorMsg(
        err.response?.data?.message ||
          err.message ||
          'Failed to verify credentials. Please ensure 2-Step Verification is active and use a 16-character Google App Password.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm('Are you sure you want to disconnect this Gmail account? Active email campaigns will be unable to dispatch.')) {
      return;
    }

    setDisconnecting(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await emailService.disconnectGmail();
      if (res.success) {
        setIsConnected(false);
        setEmail('');
        setSenderName('');
        setAppPassword('');
        setSuccessMsg('Gmail disconnected successfully.');
        if (onSettingsUpdated) onSettingsUpdated(null);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to disconnect Gmail');
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-7 overflow-hidden">
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
                Gmail Sender Settings
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Connect your Google account to automatically dispatch email outreach.
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

        {/* Connection Status Badge */}
        <div className="mt-5 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/40 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {isConnected ? (
              <>
                <div className="h-3 w-3 rounded-full bg-emerald-500 shadow-md shadow-emerald-500/50 animate-pulse" />
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Connected: {email}
                  </span>
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                    Ready to send emails
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="h-3 w-3 rounded-full bg-amber-400" />
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Not Connected
                  </span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Connect a Gmail account below to start outreach
                  </p>
                </div>
              </>
            )}
          </div>

          {isConnected && (
            <button
              onClick={handleDisconnect}
              disabled={disconnecting}
              className="px-3 py-1.5 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Unlink className="w-3.5 h-3.5" />
              <span>{disconnecting ? 'Disconnecting...' : 'Disconnect'}</span>
            </button>
          )}
        </div>

        {/* Notifications */}
        {errorMsg && (
          <div className="mt-4 p-3 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mt-4 p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-300 font-semibold">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Gmail Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. yourname@gmail.com"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Sender Name (Display Name)
            </label>
            <input
              type="text"
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              placeholder="e.g. Jane Doe - Partnerships"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Google App Password (16 characters)
              </label>
              <a
                href="https://myaccount.google.com/apppasswords"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                Generate Password ↗
              </a>
            </div>
            <div className="relative">
              <input
                type="password"
                required
                value={appPassword}
                onChange={(e) => setAppPassword(e.target.value)}
                placeholder="xxxx xxxx xxxx xxxx"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            </div>
          </div>

          {/* Setup Instructions Box */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800/80 text-[11px] text-slate-500 dark:text-slate-400 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>How to generate a Google App Password:</span>
            </div>
            <ol className="list-decimal pl-4 space-y-1 leading-relaxed">
              <li>Turn on 2-Step Verification in your Google Account.</li>
              <li>Visit <span className="font-mono text-slate-700 dark:text-slate-300">myaccount.google.com/apppasswords</span>.</li>
              <li>Create a new App Password named &quot;GeoIntel&quot;.</li>
              <li>Copy the 16-character code and paste it above.</li>
            </ol>
          </div>

          {/* Action Buttons */}
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
              disabled={saving || loading}
              className="px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-xl shadow-md shadow-emerald-500/20 hover:shadow-emerald-500/30 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying SMTP...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isConnected ? 'Update & Re-verify' : 'Verify & Connect Gmail'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GmailSettingsModal;
