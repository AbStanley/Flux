import { InteractiveEditor } from './components/InteractiveEditor';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

export const WritingModePage = () => {
  return (
    <div className="relative mt-5 min-h-screen w-full bg-background text-foreground">
      <div className="relative z-10 flex flex-col items-center p-0 px-1 pb-16 sm:px-2">
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 w-full max-w-7xl"
        >
          <div className="flex min-w-0 items-start gap-3 sm:items-center">
            <div className="mt-0.5 shrink-0 rounded-xl bg-muted p-2 text-foreground ring-1 ring-border/60 sm:mt-0">
              <Sparkles className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Interactive Writing</h1>
              <p className="text-pretty text-sm text-muted-foreground">
                Language, model, and clear sit above the canvas — Polish when you want feedback
              </p>
            </div>
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
