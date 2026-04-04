import { cn } from '@/lib/utils';
import { useWritingStore } from '../store/writing.store';

export const EditorFooter = () => {
  const { text, isAnalyzing, highlightMode, setHighlightMode } = useWritingStore();

  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <div className="mt-5 flex w-full flex-col items-center justify-between gap-4 border-t border-border/50 pt-5 text-sm select-none dark:border-white/[0.06]">
      <div className="flex flex-wrap items-center justify-center gap-3 md:justify-start md:gap-4">
        <div className="flex items-center gap-2 rounded-full border border-border/40 bg-background/40 px-2 py-1 backdrop-blur-sm dark:border-white/[0.06] dark:bg-background/20">
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white shadow-sm">
            1
          </div>
          <span className="text-xs font-medium text-muted-foreground">Grammar</span>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-border/40 bg-background/40 px-2 py-1 backdrop-blur-sm dark:border-white/[0.06] dark:bg-background/20">
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-pink-500 text-[10px] font-bold text-white shadow-sm">
            2
          </div>
          <span className="text-xs font-medium text-muted-foreground">Spelling</span>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-border/40 bg-background/40 px-2 py-1 backdrop-blur-sm dark:border-white/[0.06] dark:bg-background/20">
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-500 text-[10px] font-bold text-white shadow-sm">
            3
          </div>
          <span className="text-xs font-medium text-muted-foreground">Punctuation</span>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-border/40 bg-background/40 px-2 py-1 backdrop-blur-sm dark:border-white/[0.06] dark:bg-background/20">
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white shadow-sm">
            4
          </div>
          <span className="text-xs font-medium text-muted-foreground">Fluency</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-6 md:justify-end">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setHighlightMode(highlightMode === 'full' ? 'minimal' : 'full')}
            className={cn(
              'relative h-5 w-10 rounded-full transition-colors',
              highlightMode === 'full' ? 'bg-primary' : 'bg-muted dark:bg-zinc-700',
            )}
            title="Toggle correction highlights"
          >
            <div
              className={cn(
                'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-all',
                highlightMode === 'full' ? 'left-[22px]' : 'left-0.5',
              )}
            />
          </button>
          <span className="text-xs font-bold text-muted-foreground">
            {isAnalyzing ? 'Analyzing...' : 'Highlights'}
          </span>
        </div>

        <div className="text-xs font-medium tabular-nums text-muted-foreground">
          {readingTime} min read · {wordCount} words
        </div>
      </div>
    </div>
  );
};
