import { useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useWritingStore } from '../store/writing.store';

import { cn } from '@/lib/utils';
import { AnimatePresence } from 'framer-motion';
import { Sparkles, RotateCcw, Cpu, Languages, Trash2 } from 'lucide-react';
import { ModelSelect } from '@/presentation/components/ModelSelect';
import { LANGUAGES } from '@/content/constants';
import { CorrectionTooltip } from './CorrectionTooltip';
import { EditorFooter } from './EditorFooter';
import { HighlightedText } from './HighlightedText';
import { useAvailableModels } from '../hooks/useAvailableModels';
import { useCorrectionTooltip } from '../hooks/useCorrectionTooltip';

const editorLayerStyles = cn(
  'grid-area-1 w-full min-h-[min(28rem,55vh)] md:min-h-[32rem] text-lg leading-[1.85] whitespace-pre-wrap break-words border-none focus:ring-0 outline-none antialiased',
  'tracking-normal word-spacing-normal font-serif',
  'text-rendering-geometricPrecision font-medium',
  '[font-variant-ligatures:none] [scrollbar-gutter:stable] overflow-y-scroll',
);

export const InteractiveEditor = () => {
  const store = useWritingStore();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  const { availableModels, modelsLoadFailed } = useAvailableModels();
  const tooltip = useCorrectionTooltip();

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
                  placeholder="Server default (first available tag)"
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
                onClick={() => store.undo()}
                className="flex h-[2.75rem] w-[2.75rem] shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground lg:rounded-full lg:bg-transparent lg:hover:bg-muted/60"
                title="Undo"
              >
                <RotateCcw className="h-4 w-4" />
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
                    'relative z-0 block resize-none bg-transparent p-0 text-foreground [grid-area:1/1]',
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
                    onCorrectionClick={(mistakeText) => {
                      store.dismissCorrection(mistakeText);
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
                onDismiss={() => {
                  store.dismissCorrection(store.corrections[tooltip.hoveredId!].mistakeText);
                  tooltip.clearTooltip();
                }}
                onRevert={() => {
                  store.revertCorrection(store.corrections[tooltip.hoveredId!]);
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
