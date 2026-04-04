import { useRef, useState, useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useWritingStore } from '../store/writing.store';
import { backendAiApi } from '@/infrastructure/api/backend-ai-api';

import { cn } from '@/lib/utils';
import { AnimatePresence } from 'framer-motion';
import { Sparkles, RotateCcw, Cpu } from 'lucide-react';
import { ModelSelect } from '@/presentation/components/ModelSelect';
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
          {/* Toolbar: model (always visible) + actions */}
          <div className="relative z-40 mb-5 flex w-full flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex min-w-0 flex-1 flex-col gap-1.5 sm:max-w-md">
              <ModelSelect
                label="Model for Polish"
                leadingIcon={<Cpu className="h-3.5 w-3.5" aria-hidden />}
                value={store.evaluationModel}
                onChange={store.setEvaluationModel}
                models={modelOptions}
                placeholder="Server default (first available tag)"
                className="w-full"
              />
              {modelsLoadFailed && (
                <p className="text-xs text-amber-700/90 dark:text-amber-400/95">
                  Could not load model list from the API. You can still use Server default, or fix the API
                  connection and refresh.
                </p>
              )}
            </div>
            <div className="flex shrink-0 justify-end gap-2">
              <button
                type="button"
                onClick={() => store.undo()}
                className="rounded-full p-2.5 text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
                title="Undo"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => store.checkText(store.text, store.sourceLanguage)}
                disabled={store.isAnalyzing || !store.text.trim()}
                className={cn(
                  'flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-bold shadow-md transition-all',
                  'bg-primary text-primary-foreground hover:bg-primary/90',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                  'disabled:opacity-50 disabled:shadow-none',
                )}
              >
                <Sparkles className={cn('h-3.5 w-3.5', store.isAnalyzing && 'animate-spin')} />
                {store.isAnalyzing ? 'Analyzing...' : 'Polish'}
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
