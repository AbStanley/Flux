import React from 'react';
import { Checkbox } from '@/presentation/components/ui/checkbox';
import { FileText } from 'lucide-react';
import type { Chapter } from '../utils/epubUtils';

interface EpubChapterListProps {
    chapters: Chapter[];
    selectedHrefs: Set<string>;
    onToggle: (href: string) => void;
    depth?: number;
}

export const EpubChapterList: React.FC<EpubChapterListProps> = ({
    chapters,
    selectedHrefs,
    onToggle,
    depth = 0
}) => {
    return (
        <>
            {chapters.map((chapter, index) => (
                <div key={`${chapter.id}-${index}-${chapter.href}`} className="flex flex-col">
                    <div
                        className="flex items-center gap-3 p-2 hover:bg-muted/50 rounded-md cursor-pointer transition-colors"
                        style={{ marginLeft: `${depth * 20}px` }}
                        onClick={() => onToggle(chapter.href)}
                    >
                        <Checkbox
                            checked={selectedHrefs.has(chapter.href)}
                            onCheckedChange={() => onToggle(chapter.href)}
                            onClick={(e) => e.stopPropagation()}
                        />
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{chapter.label}</span>
                    </div>
                    {chapter.subitems && (
                        <EpubChapterList
                            chapters={chapter.subitems}
                            selectedHrefs={selectedHrefs}
                            onToggle={onToggle}
                            depth={depth + 1}
                        />
                    )}
                </div>
            ))}
        </>
    );
};
