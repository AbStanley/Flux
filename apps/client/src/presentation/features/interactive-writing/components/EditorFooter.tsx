import { cn } from '@/lib/utils';
import { useWritingStore } from '../store/writing.store';

export const EditorFooter = () => {
  const { text, isAnalyzing, highlightMode, setHighlightMode } = useWritingStore();

  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-4 mt-4 border-t border-zinc-100 dark:border-zinc-800/60 w-full px-1 text-sm select-none">
      
      {/* Correction Types Legend */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold">1</div>
          <span className="text-zinc-600 dark:text-zinc-400 text-xs font-medium">Grammar</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-pink-500 text-white flex items-center justify-center text-[10px] font-bold">2</div>
          <span className="text-zinc-600 dark:text-zinc-400 text-xs font-medium">Spelling</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-purple-500 text-white flex items-center justify-center text-[10px] font-bold">3</div>
          <span className="text-zinc-600 dark:text-zinc-400 text-xs font-medium">Punctuation</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-orange-500 text-white flex items-center justify-center text-[10px] font-bold">4</div>
          <span className="text-zinc-600 dark:text-zinc-400 text-xs font-medium">Fluency</span>
        </div>
      </div>

      {/* Right Side: Toggles & Stats */}
      <div className="flex items-center gap-6">
        
        {/* Correction Mode Toggle */}
        <div className="flex items-center gap-3">
           <button 
             onClick={() => setHighlightMode(highlightMode === 'full' ? 'minimal' : 'full')}
             className={cn(
               "w-10 h-5 rounded-full relative transition-colors",
               highlightMode === 'full' ? "bg-emerald-500" : "bg-zinc-300 dark:bg-zinc-700"
             )}
           >
             <div className={cn(
               "absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all",
               highlightMode === 'full' ? "left-[22px]" : "left-0.5"
             )} />
           </button>
           <span className="text-zinc-600 dark:text-zinc-400 text-xs font-bold">
             {isAnalyzing ? "Analyzing..." : "Correction mode"}
           </span>
        </div>

        {/* Reading Time stats */}
        <div className="text-zinc-400 dark:text-zinc-500 text-xs font-medium">
          {readingTime} min read, {wordCount} words
        </div>
      </div>

    </div>
  );
};
