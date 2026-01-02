import React from 'react';
import ReactMarkdown from 'react-markdown';
import type { RichTranslationResult } from '../../../../../core/interfaces/IAIService';

interface ExamplesListProps {
    examples: RichTranslationResult['examples'];
}

export const ExamplesList: React.FC<ExamplesListProps> = ({ examples }) => {
    if (!examples || examples.length === 0) return null;

    return (
        <div>
            <h4 className="text-sm font-semibold mb-3">Examples</h4>
            <div className="space-y-3">
                {examples.map((ex, i) => (
                    <div key={i} className="text-sm border-l-2 border-primary pl-3 py-1">
                        <div className="italic mb-1 prose dark:prose-invert prose-sm prose-p:my-0 max-w-none">
                            <ReactMarkdown>{ex.sentence}</ReactMarkdown>
                        </div>
                        <div className="text-muted-foreground prose dark:prose-invert prose-sm prose-p:my-0 max-w-none">
                            <ReactMarkdown>{ex.translation}</ReactMarkdown>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
