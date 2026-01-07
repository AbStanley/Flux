import React from 'react';
import { Button } from "../../components/ui/button";
import { Textarea } from "../../components/ui/textarea";
import { Loader2, X } from "lucide-react";

interface ReaderInputProps {
    text: string;
    isGenerating: boolean;
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    onClear: () => void;
}

export const ReaderInput: React.FC<ReaderInputProps> = ({
    text,
    isGenerating,
    onChange,
    onClear
}) => {
    return (
        <div className="relative">
            <Textarea
                placeholder="Paste text here, or generate..."
                className={`min-h-[100px] font-mono text-base shadow-sm resize-none focus-visible:ring-primary bg-secondary/30 border-border/50 ${isGenerating ? 'overflow-hidden select-none' : ''}`}
                value={text}
                onChange={onChange}
                disabled={isGenerating}
            />

            {text && !isGenerating && (
                <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8 text-muted-foreground hover:text-foreground bg-background/50 hover:bg-background/80 backdrop-blur-sm"
                    onClick={onClear}
                    title="Clear text"
                >
                    <X className="h-4 w-4" />
                </Button>
            )}

            {isGenerating && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/10 backdrop-blur-[2px] rounded-md transition-all duration-500">
                    <div className="flex items-center gap-3 p-4 bg-background/60 rounded-xl shadow-xl border border-primary/10 backdrop-blur-md animate-pulse">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        <span className="text-sm font-semibold tracking-wide text-primary">Creating Story...</span>
                    </div>
                </div>
            )}
        </div>
    );
};
