import { motion } from 'framer-motion';
import { Check, Trash2, ArrowRight } from 'lucide-react';
import type { WritingCorrection } from '@/types/writing';
import { cn } from '@/lib/utils';

interface CorrectionTooltipProps {
  correction: WritingCorrection;
  position: {
    style: React.CSSProperties;
    showAbove: boolean;
  };
  onDismiss: () => void;
  onRevert: () => void;
  onMouseLeave: () => void;
  onMouseEnter: () => void;
}

const mapTypeToColor = (type: string) => {
  const t = type.toLowerCase();
  if (t === 'grammar') return 'bg-emerald-500';
  if (t === 'spelling') return 'bg-pink-500';
  if (t === 'punctuation') return 'bg-purple-500';
  return 'bg-orange-500'; // fluency or style
};

export const CorrectionTooltip = ({
  correction,
  position,
  onDismiss,
  onRevert,
  onMouseEnter,
  onMouseLeave,
}: CorrectionTooltipProps) => {
  const typeColor = mapTypeToColor(correction.type);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: position.showAbove ? 8 : -8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: position.showAbove ? 8 : -8 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className="fixed z-[9999] w-[320px] bg-white dark:bg-[#1C1C1E] rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.12)] border border-zinc-100 dark:border-zinc-800 pointer-events-auto select-none overflow-hidden"
      style={position.style}
    >
      <div className="p-5 flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-center gap-2">
          <div className={cn("w-2 h-2 rounded-full", typeColor)} />
          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
            {correction.type}
          </span>
        </div>

        {/* Before / After */}
        <div className="flex items-center gap-3 text-[15px]">
          <span className="font-medium text-zinc-400 line-through decoration-zinc-300 dark:decoration-zinc-600">
            {correction.mistakeText}
          </span>
          <ArrowRight className="w-4 h-4 text-zinc-400 shrink-0" />
          <span className="font-bold text-zinc-900 dark:text-white">
            {correction.correctionText}
          </span>
        </div>

        {/* Explanation */}
        <p className="text-[13px] leading-relaxed text-zinc-500 dark:text-zinc-400 mt-1">
          {correction.longDescription}
        </p>
      </div>

      {/* Actions Footer */}
      <div className="px-5 pb-5 flex items-center justify-between">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDismiss();
          }}
          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full text-xs font-bold transition-colors active:scale-95"
        >
          <Check className="w-4 h-4" />
          ACCEPT
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onRevert();
          }}
          className="p-2.5 text-zinc-400 hover:text-red-500 hover:bg-red-500/10 rounded-full transition-colors"
          title="Revert to original text"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
};
