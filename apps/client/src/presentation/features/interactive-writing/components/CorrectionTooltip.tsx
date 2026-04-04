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
      className="fixed z-[9999] w-[320px] select-none overflow-hidden rounded-2xl border border-white/60 bg-card/85 shadow-[0_16px_48px_-8px_rgba(0,0,0,0.15),0_0_0_1px_rgba(255,255,255,0.5)_inset] backdrop-blur-xl backdrop-saturate-150 pointer-events-auto dark:border-white/[0.1] dark:bg-card/75 dark:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.65),inset_0_1px_0_0_rgba(255,255,255,0.06)]"
      style={position.style}
    >
      <div className="p-5 flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-center gap-2">
          <div className={cn("w-2 h-2 rounded-full", typeColor)} />
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            {correction.type}
          </span>
        </div>

        {/* Before / After */}
        <div className="flex items-center gap-3 text-[15px]">
          <span className="font-medium text-muted-foreground line-through decoration-border">
            {correction.mistakeText}
          </span>
          <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="font-bold text-foreground">
            {correction.correctionText}
          </span>
        </div>

        {/* Explanation */}
        <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
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
          className="rounded-full p-2.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          title="Revert to original text"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
};
