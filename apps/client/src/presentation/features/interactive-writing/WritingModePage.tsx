import { useWritingStore } from './store/writing.store';
import { InteractiveEditor } from './components/InteractiveEditor';
import { motion } from 'framer-motion';
import { Trash2, Languages, Sparkles } from 'lucide-react';
import { LANGUAGES } from '@/content/constants';

export const WritingModePage = () => {
  const { sourceLanguage, setSourceLanguage, clearAll } = useWritingStore();

  return (
    <div className="relative min-h-screen text-zinc-950 dark:text-zinc-50 w-full">
      <div className="relative z-10 p-0 flex flex-col items-center">
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-7xl flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 bg-indigo-500 rounded-xl shadow-lg shadow-indigo-500/20 shrink-0">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold tracking-tight">Interactive Writing</h1>
              <p className="text-sm text-zinc-500">
                Pick the Ollama model above the editor, then Polish — nothing runs while you type
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-zinc-900 rounded-full border border-zinc-200 dark:border-zinc-800 shadow-sm">
              <Languages className="w-4 h-4 text-zinc-400 shrink-0" />
              <select
                value={sourceLanguage}
                onChange={(e) => setSourceLanguage(e.target.value)}
                className="bg-transparent text-sm font-medium focus:outline-none cursor-pointer max-w-[200px]"
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
              className="p-2 text-zinc-400 hover:text-red-500 transition-colors"
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

        <footer className="mt-12 text-zinc-400 text-sm italic">
          "Write with freedom, the AI handles the friction."
        </footer>
      </div>
    </div>
  );
};
