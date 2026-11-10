import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const Toast = ({ message, type = 'success', onClose, duration = 4000 }) => {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  const isSuccess = type === 'success';
  const isError = type === 'error';

  return (
    <div className="fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border transition-all animate-slide-in bg-white dark:bg-slate-900"
         style={{ minWidth: '280px', maxWidth: '420px' }}>
      {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />}
      {isError && <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />}
      {!isSuccess && !isError && <Info className="w-5 h-5 text-blue-500 shrink-0" />}
      
      <p className="text-sm font-medium text-slate-700 dark:text-slate-200 flex-1">
        {message}
      </p>

      <button
        onClick={onClose}
        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
        aria-label="Close notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default Toast;

