import { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, X, Sparkles } from 'lucide-react';
import { Button } from './ui/button';

export const PwaUpdateToast = () => {
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_, r) {
      if (r) {
        setSwRegistration(r);
      }
    }
  });

  useEffect(() => {
    if (!swRegistration) return;

    // Force browser to check the server for sw.js updates
    const checkUpdate = () => {
      swRegistration.update().catch((err) => {
        console.error('Failed to check for SW update:', err);
      });
    };

    // Check immediately when the tab is focused
    window.addEventListener('focus', checkUpdate);

    // Also run a periodic check every 10 minutes in the background
    const interval = setInterval(checkUpdate, 10 * 60 * 1000);

    return () => {
      window.removeEventListener('focus', checkUpdate);
      clearInterval(interval);
    };
  }, [swRegistration]);

  const handleUpdate = () => {
    updateServiceWorker(true);
  };

  const handleClose = () => {
    setNeedRefresh(false);
  };

  return (
    <AnimatePresence>
      {needRefresh && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="fixed bottom-6 left-6 z-[600] max-w-sm w-full bg-slate-950/90 border border-indigo-500/30 text-slate-100 rounded-xl shadow-2xl p-4 flex flex-col gap-3 backdrop-blur-md"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex gap-3">
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 shrink-0">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h4 className="font-semibold text-sm">Update Available</h4>
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                  A new version of Flux is ready. Refresh now to experience the latest features and fixes! :)
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="text-slate-400 hover:text-slate-200 transition-colors p-1 rounded-lg hover:bg-slate-800"
              aria-label="Dismiss update notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center gap-2 self-end">
            <Button
              onClick={handleClose}
              variant="ghost"
              size="sm"
              className="text-xs text-slate-400 hover:text-slate-200"
            >
              Later
            </Button>
            <Button
              onClick={handleUpdate}
              size="sm"
              className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white gap-2 font-medium"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reload Now
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
