import { useState, useEffect, useCallback } from 'react';
import { Mail, CheckCircle2, AlertCircle, X, Loader2, Unlink, ExternalLink, ShieldCheck, RefreshCw, UserCheck } from 'lucide-react';
import emailService from '../services/emailService';

const GmailSettingsModal = ({ isOpen, onClose, onSettingsUpdated }) => {
  const [account, setAccount] = useState(null);
  const [senderName, setSenderName] = useState('');
  const [loading, setLoading] = useState(false);
  const [initiatingOAuth, setInitiatingOAuth] = useState(false);
  const [updatingName, setUpdatingName] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchAccount = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await emailService.getConnectedAccount();
      if (res.success && res.account) {
        setAccount({
          ...res.account,
          isConnected: res.connected && !res.hasInsufficientScopes,
          hasInsufficientScopes: res.hasInsufficientScopes,
        });
        setSenderName(res.account.senderName || '');
      } else {
        setAccount(null);
        setSenderName('');
      }
    } catch (err) {
      console.error('Failed to load Gmail account:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchAccount();
    }
  }, [isOpen, fetchAccount]);

  if (!isOpen) return null;

  const handleConnectGoogle = async () => {
    setInitiatingOAuth(true);
    setErrorMsg('');
    try {
      const currentPath = window.location.pathname + window.location.search;
      const res = await emailService.getGoogleAuthUrl(currentPath);
      if (res.success && res.url) {
        window.location.href = res.url;
      } else {
        setErrorMsg('Failed to generate Google OAuth consent link. Check backend server configuration.');
        setInitiatingOAuth(false);
      }
    } catch (err) {
      setErrorMsg(
        err.response?.data?.message ||
          err.message ||
          'Failed to initialize Google OAuth. Please check client credentials on backend.'
      );
      setInitiatingOAuth(false);
    }
  };

  const handleUpdateSenderName = async (e) => {
    e.preventDefault();
    if (!senderName.trim()) return;

    setUpdatingName(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await emailService.updateSenderName(senderName.trim());
      if (res.success) {
        setSuccessMsg('Sender display name updated!');
        if (onSettingsUpdated) onSettingsUpdated({ ...account, senderName: res.senderName, isConnected: true });
        setTimeout(() => setSuccessMsg(''), 2500);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to update sender name');
    } finally {
      setUpdatingName(false);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm('Are you sure you want to disconnect this Gmail account? Active email campaigns will be stopped from dispatching.')) {
      return;
    }

    setDisconnecting(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await emailService.disconnectAccount();
      if (res.success) {
        setAccount(null);
        setSenderName('');
        setSuccessMsg('Gmail account disconnected successfully.');
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
                Gmail Integration
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Google OAuth 2.0 &amp; Gmail REST API
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

        {/* Notification alerts */}
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

        {/* Loading state */}
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
            <p className="text-xs font-semibold text-slate-500">Checking Gmail OAuth status...</p>
          </div>
        ) : account && account.hasInsufficientScopes ? (
          /* INSUFFICIENT SCOPES STATE */
          <div className="mt-5 space-y-5">
            <div className="p-4 rounded-2xl border border-amber-300 dark:border-amber-800 bg-amber-50/80 dark:bg-amber-950/40 space-y-3">
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-xs">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                <span>Permission Missing: "Send email on your behalf"</span>
              </div>
              <p className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
                Your Google account <strong>({account.email})</strong> is linked, but the checkbox for <strong>"Send email on your behalf"</strong> was left unchecked on Google&apos;s authorization screen.
              </p>
              <div className="p-3.5 bg-white/80 dark:bg-black/40 rounded-xl border border-amber-200 dark:border-amber-800/60 text-xs text-amber-900 dark:text-amber-300 space-y-1.5">
                <p className="font-bold text-[11px] uppercase tracking-wider">How to resolve:</p>
                <ol className="list-decimal list-inside space-y-1 text-[11px] leading-relaxed">
                  <li>Click the <strong>Re-authorize Google Account</strong> button below.</li>
                  <li>On Google&apos;s consent screen, tick the checkbox: <strong>&quot;Send email on your behalf&quot;</strong>.</li>
                  <li>Click <strong>Continue</strong> to grant email dispatch capability.</li>
                </ol>
              </div>

              <button
                type="button"
                onClick={handleConnectGoogle}
                disabled={initiatingOAuth}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {initiatingOAuth ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Connecting to Google...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    <span>Re-authorize with &quot;Send email&quot; Permission</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={handleDisconnect}
                disabled={disconnecting}
                className="text-xs font-semibold text-red-600 hover:underline cursor-pointer"
              >
                {disconnecting ? 'Disconnecting...' : 'Disconnect Account'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        ) : account && account.isConnected ? (
          /* CONNECTED STATE */
          <div className="mt-5 space-y-5">
            {/* Account Card */}
            <div className="p-4 rounded-2xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/60 dark:bg-emerald-950/20 flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                {account.picture ? (
                  <img
                    src={account.picture}
                    alt={account.senderName || account.email}
                    className="w-11 h-11 rounded-full border-2 border-emerald-400 shadow-sm"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-sm uppercase shadow-sm">
                    {account.email.charAt(0)}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                      {account.email}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/80 dark:text-emerald-300">
                      OAuth 2.0
                    </span>
                  </div>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium mt-0.5 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Authorized for Gmail API email dispatch
                  </p>
                </div>
              </div>

              <button
                onClick={handleDisconnect}
                disabled={disconnecting}
                className="px-3 py-1.5 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/40 rounded-xl transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
              >
                <Unlink className="w-3.5 h-3.5" />
                <span>{disconnecting ? 'Disconnecting...' : 'Disconnect'}</span>
              </button>
            </div>

            {/* Sender Name Form */}
            <form onSubmit={handleUpdateSenderName} className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Sender Display Name
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    placeholder="e.g. Sarah Connor - Business Dev"
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    type="submit"
                    disabled={updatingName || !senderName.trim()}
                    className="px-4 py-2.5 text-xs font-bold text-white bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
                  >
                    {updatingName ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserCheck className="w-3.5 h-3.5" />}
                    <span>Save</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  This is the friendly name recipients see in their inbox alongside your Gmail address.
                </p>
              </div>
            </form>

            {/* Security Badge */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800/80 text-[11px] text-slate-500 dark:text-slate-400 space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Enterprise Token Security</span>
              </div>
              <p className="leading-relaxed">
                Your account is linked using Google OAuth 2.0 with the official Gmail REST API. Refresh tokens are AES-256-GCM encrypted on the server and access tokens automatically rotate.
              </p>
            </div>

            {/* Switch Account */}
            <div className="pt-2 flex justify-between items-center border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={handleConnectGoogle}
                disabled={initiatingOAuth}
                className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Switch / Re-authorize Google Account</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-white bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* NOT CONNECTED STATE */
          <div className="mt-5 space-y-5">
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/40 space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  No Gmail Account Connected
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Connect your Google account in one click. GeoIntel uses the official Gmail REST API to dispatch personalized campaigns with high deliverability.
              </p>
            </div>

            {/* Google OAuth Button */}
            <button
              type="button"
              onClick={handleConnectGoogle}
              disabled={initiatingOAuth}
              className="w-full py-3.5 px-4 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-800 dark:text-white font-bold text-sm shadow-sm hover:shadow-md transition flex items-center justify-center gap-3 cursor-pointer disabled:opacity-60"
            >
              {initiatingOAuth ? (
                <>
                  <Loader2 className="w-5 h-5 text-emerald-500 animate-spin" />
                  <span>Connecting to Google...</span>
                </>
              ) : (
                <>
                  {/* Google SVG Logo */}
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Connect with Google</span>
                  <ExternalLink className="w-4 h-4 text-slate-400" />
                </>
              )}
            </button>

            {/* Security Perks */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800/80 text-[11px] text-slate-500 dark:text-slate-400 space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Zero Passwords Required</span>
              </div>
              <ul className="space-y-1.5 pl-1">
                <li className="flex items-center gap-2">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span>Direct Google OAuth 2.0 authorization</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span>No App Passwords or SMTP credentials stored</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span>AES-256-GCM backend encrypted refresh tokens</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span>Revoke access anytime from your Google security dashboard</span>
                </li>
              </ul>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GmailSettingsModal;
