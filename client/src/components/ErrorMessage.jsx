import { AlertCircle, XCircle } from 'lucide-react';


const ErrorMessage = ({ message, type = 'error', onClose }) => {
  if (!message) return null;

  const styles = {
    error: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950/30 dark:border-red-900/50 dark:text-red-300',
    warning: 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/30 dark:border-amber-900/50 dark:text-amber-300',
    info: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950/30 dark:border-blue-900/50 dark:text-blue-300'
  };

  return (
    <div className={`flex items-start gap-3 p-4 rounded-xl border ${styles[type]} text-sm font-medium shadow-sm transition-all duration-300 my-4`}>
      <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
      <div className="flex-1">
        {message}
      </div>
      {onClose && (
        <button 
          onClick={onClose} 
          className="p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded transition"
          aria-label="Dismiss"
        >
          <XCircle className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;
