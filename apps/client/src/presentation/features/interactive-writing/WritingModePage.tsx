import { useWritingStore } from './store/writing.store';
import { InteractiveEditor } from './components/InteractiveEditor';
import { motion } from 'framer-motion';
import { Trash2, Languages, Sparkles } from 'lucide-react';
import { LANGUAGES } from '@/content/constants';

export const WritingModePage = () => {
  const { sourceLanguage, setSourceLanguage, clearAll } = useWritingStore();

  return (
    <div className="relative min-h-screen w-full bg-background text-foreground">
      <div className="relative z-10 flex flex-col items-center p-0 px-1 pb-16 sm:px-2">
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-7xl flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="shrink-0 rounded-xl bg-muted p-2 text-foreground ring-1 ring-border/60">
              <Sparkles className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold tracking-tight mt-5">Interactive Writing</h1>
              <p className="text-sm text-muted-foreground">
                Pick the model above the canvas, then Polish — nothing runs while you type
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <div className="flex items-center gap-2 rounded-full border border-border/60 bg-card/50 px-3 py-1.5 shadow-sm backdrop-blur-md dark:bg-card/40 dark:border-white/10">
              <Languages className="w-4 h-4 text-muted-foreground shrink-0" />
              <select
                value={sourceLanguage}
                onChange={(e) => setSourceLanguage(e.target.value)}
                className="max-w-[200px] cursor-pointer bg-transparent text-sm font-medium text-foreground focus:outline-none"
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={clearAll}
              className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
              title="Clear all"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </motion.header>

        <motion.main
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="w-full max-w-7xl"
        >
          <InteractiveEditor />
        </motion.main>
      </div>
    </div>
  );
};
