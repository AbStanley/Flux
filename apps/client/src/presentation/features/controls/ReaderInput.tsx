import { type ChangeEvent } from 'react';
import { Button } from "../../components/ui/button";
import { Textarea } from "../../components/ui/textarea";
import { Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReaderInputProps {
    text: string;
    isGenerating: boolean;
    onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
    onClear: () => void;
}

export function ReaderInput({
    text,
    isGenerating,
    onChange,
    onClear
}: ReaderInputProps) {
    return (
        <div className={cn("relative")}>
            <Textarea
                placeholder="Paste text here, or generate..."
                className={cn("min-h-[80px] h-[80px] overflow-y-auto font-mono text-base shadow-sm resize-y focus-visible:ring-primary bg-[var(--reader-textarea-bg)] border-border/50 transition-[border-color,box-shadow,background-color] duration-300",
                    (text.length > 0 || isGenerating) && "min-h-[120px] max-h-[400px]"
                )}
                value={text}
                onChange={onChange}
                disabled={isGenerating}
            />

            {text && !isGenerating && (
                <Button
                    variant="ghost"
                    size="icon"
                    className={cn("absolute top-2 right-5 h-8 w-8 text-muted-foreground hover:text-foreground bg-background/50 hover:bg-background/80 backdrop-blur-sm")}
                    onClick={onClear}
                    title="Clear text"
                >
                    <X className="h-4 w-4" />
                </Button>
            )}

            {isGenerating && (
                <div className={cn("absolute bottom-4 right-4 z-10 flex flex-col items-center justify-center transition-all duration-500")}>
                    <div className={cn("flex items-center gap-2 p-3 bg-background/80 rounded-full shadow-lg border border-primary/20 backdrop-blur-md animate-pulse")}>
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    </div>
                </div>
            )}
        </div>
    );
}
