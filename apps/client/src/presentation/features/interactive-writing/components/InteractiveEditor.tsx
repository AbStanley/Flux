import { useRef, useState, useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useWritingStore } from '../store/writing.store';

import { cn } from '@/lib/utils';
import { AnimatePresence } from 'framer-motion';
import { Sparkles, RotateCcw } from 'lucide-react';
import { CorrectionTooltip } from './CorrectionTooltip';
import { EditorFooter } from './EditorFooter';

const sharedStyles = cn(
  "grid-area-1 w-full min-h-[400px] p-4 md:p-6 text-lg leading-[1.75] whitespace-pre-wrap break-words border-none focus:ring-0 outline-none antialiased",
  "tracking-normal word-spacing-normal font-serif",
  "text-rendering-geometricPrecision font-medium",
  "[font-variant-ligatures:none] [scrollbar-gutter:stable] overflow-y-scroll"
);

export const InteractiveEditor = () => {
  const store = useWritingStore();
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState<DOMRect | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
          className={cn("relative inline transition-all cursor-pointer rounded-sm pointer-events-auto z-30", styling,
            isHovered && "bg-opacity-20 shadow-sm ring-2 ring-white/10"
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
    <div className="relative w-full max-w-7xl mx-auto rounded-3xl bg-white dark:bg-[#1C1C1E] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)] transition-all p-2 md:p-4 border border-zinc-100 dark:border-zinc-800">
      {/* Top Toolbar Action */}
      <div className="flex justify-end mb-4 relative z-40">
        <button
          onClick={() => store.undo()}
          className="p-2.5 mr-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 rounded-full transition-all"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
        <button
          onClick={() => store.checkText(store.text, store.sourceLanguage)}
          disabled={store.isAnalyzing || !store.text.trim()}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-xs shadow-sm bg-emerald-500 hover:bg-emerald-600 text-white transition-all disabled:opacity-50"
        >
          <Sparkles className={cn("w-3.5 h-3.5", store.isAnalyzing && "animate-spin")} />
          {store.isAnalyzing ? "Analyzing..." : "Polish"}
        </button>
      </div>

      <div className="grid grid-cols-1 relative">
        <textarea
          ref={textareaRef}
          value={store.text}
          onChange={(e) => store.setText(e.target.value)}
          onScroll={handleScroll}
          spellCheck={false}
          className={cn(sharedStyles, "relative bg-transparent z-0 block resize-none text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400/50 [grid-area:1/1] p-0")}
          placeholder="Start writing freely. Use the 'Polish' button to get grammar and fluency suggestions."
        />
        <div ref={backdropRef} className={cn(sharedStyles, "pointer-events-none text-transparent [grid-area:1/1] z-10 p-0")} aria-hidden="true">
          {renderHighlightedText()}
        </div>
      </div>

      <EditorFooter />

      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {hoveredId !== null && store.corrections[hoveredId] && (
            <CorrectionTooltip
              correction={store.corrections[hoveredId]}
              position={{ style, showAbove }}
              onDismiss={() => {
                store.dismissCorrection(store.corrections[hoveredId].mistakeText);
                setHoveredId(null); setTooltipPos(null);
              }}
              onRevert={() => {
                store.revertCorrection(store.corrections[hoveredId]);
                setHoveredId(null); setTooltipPos(null);
              }}
              onMouseEnter={() => {
                if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
              }}
              onMouseLeave={() => {
                hideTimeoutRef.current = setTimeout(() => { setHoveredId(null); setTooltipPos(null); }, 100);
              }}
            />
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};
