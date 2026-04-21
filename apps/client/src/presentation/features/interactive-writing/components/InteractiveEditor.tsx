import { useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useWritingStore } from '../store/writing.store';

import { cn } from '@/lib/utils';
import { AnimatePresence } from 'framer-motion';
import { Sparkles, Cpu, Languages, Trash2 } from 'lucide-react';
import { ModelSelect } from '@/presentation/components/ModelSelect';
import { LANGUAGES } from '@/content/constants';
import { CorrectionTooltip } from './CorrectionTooltip';
import { EditorFooter } from './EditorFooter';
import { HighlightedText } from './HighlightedText';
import { useAvailableModels } from '../hooks/useAvailableModels';
import { useCorrectionTooltip } from '../hooks/useCorrectionTooltip';

const editorLayerStyles = cn(
  'grid-area-1 w-full text-lg leading-[1.85] whitespace-pre-wrap break-words border-none focus:ring-0 outline-none antialiased',
  'tracking-normal word-spacing-normal font-serif',
  'text-rendering-geometricPrecision font-medium',
  '[font-variant-ligatures:none] [scrollbar-gutter:stable] overflow-y-auto',
);

export const InteractiveEditor = () => {
  const store = useWritingStore();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  const { availableModels, modelsLoadFailed } = useAvailableModels();
  const tooltip = useCorrectionTooltip();

  // Auto-select first available model when none is set
  useEffect(() => {
    if (!store.evaluationModel && availableModels.length > 0) {
      store.setEvaluationModel(availableModels[0]);
    }
  }, [availableModels, store]);

  const modelOptions =
    store.evaluationModel && !availableModels.includes(store.evaluationModel)
      ? [store.evaluationModel, ...availableModels]
      : availableModels;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault(); store.undo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [store]);

  useEffect(() => {
    if (store.lastAppliedInfo) {
      const t = setTimeout(() => store.clearLastApplied(), 1000);
      return () => clearTimeout(t);
    }
  }, [store]);

  // Auto-resize textarea to fit content
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.max(el.scrollHeight, 160)}px`;
  }, [store.text]);

  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (backdropRef.current) backdropRef.current.scrollTop = e.currentTarget.scrollTop;
  };

  const { style, showAbove } = tooltip.getPosInfo();

  return (
    <div className="relative mx-auto w-full max-w-7xl">
      <div
        className={cn(
          'relative overflow-hidden rounded-[1.75rem]',
          'border border-border/50 bg-card/50 shadow-lg shadow-black/[0.04] backdrop-blur-2xl backdrop-saturate-150',
          'dark:border-white/[0.08] dark:bg-card/35 dark:shadow-[0_8px_40px_-12px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.04)]',
        )}
      >
        <div
          className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-border/80 to-transparent dark:via-white/10"
          aria-hidden
        />
        <div className="relative p-3 sm:p-4 md:p-5">
          {/* Toolbar */}
          <div className="relative z-40 mb-5 flex w-full min-w-0 flex-col gap-4 lg:flex-row lg:items-end lg:justify-between lg:gap-6">
            <div className="flex min-w-0 w-full flex-1 flex-col gap-3">
              <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-end sm:gap-3">
                <ModelSelect
                  label="Model for Polish"
                  leadingIcon={<Cpu className="h-3.5 w-3.5" aria-hidden />}
                  value={store.evaluationModel}
                  onChange={store.setEvaluationModel}
                  models={modelOptions}
                  placeholder="Select a model"
                  className="min-w-0 w-full sm:min-w-0 sm:max-w-md sm:flex-1 sm:basis-0"
                />
                <div className="flex min-w-0 w-full shrink-0 gap-2 sm:w-auto sm:max-w-full">
                  <div className="flex min-h-[2.75rem] min-w-0 flex-1 items-center gap-2 rounded-xl border border-border/70 bg-background/55 px-3 py-2 shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-background/25 sm:min-w-[12rem] sm:flex-initial sm:py-0">
                    <Languages className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                    <label htmlFor="flux-writing-lang" className="sr-only">
                      Writing language
                    </label>
                    <select
                      id="flux-writing-lang"
                      value={store.sourceLanguage}
                      onChange={(e) => store.setSourceLanguage(e.target.value)}
                      className="min-w-0 flex-1 cursor-pointer truncate bg-transparent text-sm font-medium text-foreground focus:outline-none"
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
                    onClick={() => store.clearAll()}
                    className="flex h-[2.75rem] w-[2.75rem] shrink-0 items-center justify-center rounded-xl border border-border/70 bg-background/55 text-muted-foreground shadow-sm backdrop-blur-sm transition-colors hover:bg-destructive/10 hover:text-destructive dark:border-white/10 dark:bg-background/25"
                    title="Clear all text"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
              {modelsLoadFailed && (
                <p className="text-xs text-amber-700/90 dark:text-amber-400/95">
                  Could not load model list from the API. You can still use Server default, or fix the API
                  connection and refresh.
                </p>
              )}
            </div>

            <div
              className={cn(
                'flex w-full min-w-0 gap-2 border-t border-border/40 pt-3',
                'lg:w-auto lg:shrink-0 lg:border-t-0 lg:pt-0',
              )}
            >
              <button
                type="button"
                onClick={() => {
                  const prompts = [
                    "Describe a childhood memory that still makes you smile today.",
                    "If you could travel to any point in the future, where would you go and why?",
                    "What are the qualities you value most in a close friend?",
                    "Write about a fictional character you'd love to meet in real life.",
                    "How has technology changed the way you communicate with others?",
                    "What does your 'ideal day' look like from morning until night?",
                    "Discuss a book or movie that significantly changed your perspective on life.",
                    "If you could start any business tomorrow, what would it be?",
                    "What advice would you give to your 10-year-old self?",
                    "Describe a place where you feel completely at peace.",
                    "Is it better to be a 'jack of all trades' or a master of one? Why?",
                    "What is a tradition from your culture that you find particularly meaningful?",
                    "If you could have dinner with anyone from history, who would it be?",
                    "Explain a complex hobby of yours to someone who has never heard of it.",
                    "What do you think is the most important invention of the last century?",
                    "Write about a time you stepped out of your comfort zone and what happened.",
                    "How do you stay motivated when things get difficult?",
                    "If you could change one thing about the world, what would it be and why?",
                    "Describe the best meal you've ever had in vivid detail.",
                    "What does 'success' mean to you personally?"
                  ];
                  
                  // Simple shuffle logic avoiding the same prompt twice in a row
                  let nextPrompt = prompts[Math.floor(Math.random() * prompts.length)];
                  while (nextPrompt === store.text) {
                    nextPrompt = prompts[Math.floor(Math.random() * prompts.length)];
                  }
                  
                  store.setText(nextPrompt);
                }}
                className={cn(
                  'flex min-h-[2.75rem] items-center justify-center gap-2 rounded-xl px-4 text-xs font-bold shadow-sm transition-all',
                  'sm:px-5 lg:flex-none lg:rounded-full lg:px-5',
                  'bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border/50',
                )}
                title="Get a creative writing prompt"
              >
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                  <span>Suggest Topic</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => store.checkText(store.text, store.sourceLanguage)}
                disabled={store.isAnalyzing || !store.text.trim()}
                className={cn(
                  'flex min-h-[2.75rem] min-w-0 flex-1 items-center justify-center gap-2 rounded-xl px-4 text-xs font-bold shadow-md transition-all',
                  'sm:px-5 lg:flex-none lg:rounded-full lg:px-5',
                  'bg-primary text-primary-foreground hover:bg-primary/90',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                  'disabled:opacity-50 disabled:shadow-none',
                )}
              >
                <Sparkles className={cn('h-3.5 w-3.5 shrink-0', store.isAnalyzing && 'animate-spin')} />
                <span className="truncate">{store.isAnalyzing ? 'Analyzing...' : 'Polish'}</span>
              </button>
            </div>
          </div>

          {/* Writing canvas */}
          <div className="rounded-2xl border border-border/60 bg-muted/20 p-[1px] dark:border-white/[0.07] dark:bg-white/[0.03]">
            <div
              className={cn(
                'overflow-hidden rounded-[0.9rem]',
                'bg-background/90 backdrop-blur-md',
                'shadow-[inset_0_1px_0_0_rgba(255,255,255,0.35)] dark:bg-background/50 dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]',
              )}
            >
              <div className="relative grid grid-cols-1 px-5 py-6 md:px-8 md:py-8">
                <textarea
                  ref={textareaRef}
                  value={store.text}
                  onChange={(e) => store.setText(e.target.value)}
                  onScroll={handleScroll}
                  spellCheck={false}
                  className={cn(
                    editorLayerStyles,
                    'relative z-0 block min-h-[10rem] resize-none bg-transparent p-0 text-foreground [grid-area:1/1]',
                    'caret-primary placeholder:text-muted-foreground/55 selection:bg-primary/15 dark:selection:bg-primary/25',
                  )}
                  placeholder="Write here — calm surface, clear feedback. Use Polish when you want suggestions."
                />
                <div
                  ref={backdropRef}
                  className={cn(editorLayerStyles, 'pointer-events-none z-10 p-0 text-transparent [grid-area:1/1]')}
                  aria-hidden="true"
                >
                  <HighlightedText
                    text={store.text}
                    corrections={store.corrections}
                    highlightMode={store.highlightMode}
                    hoveredId={tooltip.hoveredId}
                    onCorrectionClick={(_mistakeText, index) => {
                      const correction = store.corrections[index];
                      if (correction) store.acceptCorrection(correction);
                      tooltip.clearTooltip();
                    }}
                    onCorrectionEnter={tooltip.onCorrectionEnter}
                    onCorrectionLeave={tooltip.onCorrectionLeave}
                  />
                </div>
              </div>
            </div>
          </div>

          <EditorFooter />
        </div>
      </div>

      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {tooltip.hoveredId !== null && store.corrections[tooltip.hoveredId] && (
              <CorrectionTooltip
                correction={store.corrections[tooltip.hoveredId]}
                position={{ style, showAbove }}
                onAccept={() => {
                  store.acceptCorrection(store.corrections[tooltip.hoveredId!]);
                  tooltip.clearTooltip();
                }}
                onDismiss={() => {
                  store.dismissCorrection(store.corrections[tooltip.hoveredId!].mistakeText);
                  tooltip.clearTooltip();
                }}
                onMouseEnter={tooltip.onTooltipEnter}
                onMouseLeave={tooltip.onTooltipLeave}
              />
            )}
          </AnimatePresence>,
          document.body,
        )}
    </div>
  );
};
