import { useRef, useState, useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useWritingStore } from '../store/writing.store';
import { backendAiApi } from '@/infrastructure/api/backend-ai-api';

import { cn } from '@/lib/utils';
import { AnimatePresence } from 'framer-motion';
import { Sparkles, RotateCcw, Cpu, Languages, Trash2 } from 'lucide-react';
import { ModelSelect } from '@/presentation/components/ModelSelect';
import { LANGUAGES } from '@/content/constants';
import { CorrectionTooltip } from './CorrectionTooltip';
import { EditorFooter } from './EditorFooter';

const editorLayerStyles = cn(
  'grid-area-1 w-full min-h-[min(28rem,55vh)] md:min-h-[32rem] text-lg leading-[1.85] whitespace-pre-wrap break-words border-none focus:ring-0 outline-none antialiased',
  'tracking-normal word-spacing-normal font-serif',
  'text-rendering-geometricPrecision font-medium',
  '[font-variant-ligatures:none] [scrollbar-gutter:stable] overflow-y-scroll',
);

export const InteractiveEditor = () => {
  const store = useWritingStore();
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [modelsLoadFailed, setModelsLoadFailed] = useState(false);
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState<DOMRect | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let cancelled = false;
    backendAiApi
      .listModels()
      .then((res) => {
        if (cancelled) return;
        setModelsLoadFailed(false);
        setAvailableModels(res.models?.map((m) => m.name) ?? []);
      })
      .catch(() => {
        if (!cancelled) {
          setAvailableModels([]);
          setModelsLoadFailed(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

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

  useEffect(() => {
    if (hoveredId === null) return;
    const update = () => {
      const el = document.querySelector(`[data-correction-id="${hoveredId}"]`);
      if (el) setTooltipPos(el.getBoundingClientRect());
    };
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => { window.removeEventListener('scroll', update, true); window.removeEventListener('resize', update); };
  }, [hoveredId]);

  const renderHighlightedText = () => {
    if (!store.text) return null;
    if (store.highlightMode !== 'full') return store.text;

    const sorted = [...store.corrections].map((c, i) => ({ ...c, originalIndex: i }))
      .sort((a, b) => (a.offset || 0) - (b.offset || 0));

    const result: ReactNode[] = [];
    let lastIndex = 0;

    sorted.forEach((corr) => {
      if (corr.offset! < lastIndex) return;

      const actualText = store.text.slice(corr.offset!, corr.offset! + corr.length!);
      const matches = actualText.toLowerCase() === corr.correctionText.toLowerCase();

      if (corr.offset! > lastIndex) {
        const part = store.text.slice(lastIndex, corr.offset!);
        result.push(part);
      }

      if (!matches) {
        result.push(actualText);
        lastIndex = corr.offset! + corr.length!;
        return;
      }

      const isHovered = hoveredId === corr.originalIndex;
      const t = corr.type.toLowerCase();
      // UX redesign styling: dotted/dashed underlines
      let styling = 'border-b-[2.5px] border-dotted border-emerald-500 hover:bg-emerald-500/10 dark:text-emerald-100';
      if (t === 'spelling') styling = 'border-b-[2.5px] border-dotted border-pink-500 hover:bg-pink-500/10 dark:text-pink-100';
      if (t === 'punctuation') styling = 'border-b-[2.5px] border-dotted border-purple-500 hover:bg-purple-500/10 dark:text-purple-100';
      if (t === 'fluency' || t === 'style') styling = 'border-b-[2.5px] border-dotted border-orange-500 hover:bg-orange-500/10 dark:text-orange-100';

      result.push(
        <span
          key={`corr-${corr.originalIndex}-${corr.offset}`}
          data-correction-id={corr.originalIndex}
          onClick={(e) => {
            e.stopPropagation();
            store.revertCorrection(store.corrections[corr.originalIndex!]);
            setHoveredId(null); setTooltipPos(null);
          }}
          onMouseEnter={(e) => {
            if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
            setHoveredId(corr.originalIndex!);
            setTooltipPos(e.currentTarget.getBoundingClientRect());
          }}
          onMouseLeave={() => {
            hideTimeoutRef.current = setTimeout(() => {
              setHoveredId(null); setTooltipPos(null);
            }, 100);
          }}
          className={cn(
            'relative z-30 cursor-pointer rounded-sm transition-all pointer-events-auto',
            styling,
            isHovered && 'shadow-sm ring-2 ring-primary/25 dark:ring-emerald-400/30',
          )}
        >
          {actualText}
        </span>
      );
      lastIndex = corr.offset! + corr.length!;
    });

    if (lastIndex < store.text.length) {
      result.push(store.text.slice(lastIndex));
    }
    return result;
  };

  const getPosInfo = () => {
    if (!tooltipPos) return { style: { opacity: 0 }, showAbove: false };
    const spaceBelow = window.innerHeight - tooltipPos.bottom;
    const showAbove = spaceBelow < 220 && tooltipPos.top > spaceBelow;
    return {
      style: {
        top: showAbove ? tooltipPos.top - 12 : tooltipPos.bottom + 12,
        left: Math.max(16, Math.min(window.innerWidth - 320, tooltipPos.left + tooltipPos.width / 2 - 160)),
        transformOrigin: showAbove ? 'bottom center' : 'top center',
      },
      showAbove,
    };
  };

  const { style, showAbove } = getPosInfo();

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
          {/* Toolbar: responsive — narrow = stacked sections; lg = one row */}
          <div className="relative z-40 mb-5 flex w-full min-w-0 flex-col gap-4 lg:flex-row lg:items-end lg:justify-between lg:gap-6">
            <div className="flex min-w-0 w-full flex-1 flex-col gap-3">
              {/* Model full width; language + clear share a row (grow / fixed) */}
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

            {/* Actions: own row on small screens (full-width Polish); inline on lg */}
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

          {/* Writing canvas — neutral inset well (no chromatic gradients) */}
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
                  {renderHighlightedText()}
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
            {hoveredId !== null && store.corrections[hoveredId] && (
              <CorrectionTooltip
                correction={store.corrections[hoveredId]}
                position={{ style, showAbove }}
                onDismiss={() => {
                  store.dismissCorrection(store.corrections[hoveredId].mistakeText);
                  setHoveredId(null);
                  setTooltipPos(null);
                }}
                onRevert={() => {
                  store.revertCorrection(store.corrections[hoveredId]);
                  setHoveredId(null);
                  setTooltipPos(null);
                }}
                onMouseEnter={() => {
                  if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
                }}
                onMouseLeave={() => {
                  hideTimeoutRef.current = setTimeout(() => {
                    setHoveredId(null);
                    setTooltipPos(null);
                  }, 100);
                }}
              />
            )}
          </AnimatePresence>,
          document.body,
        )}
    </div>
  );
};
