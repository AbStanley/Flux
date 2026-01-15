import ReactMarkdown from 'react-markdown';

interface AnalysisSectionProps {
    syntaxAnalysis?: string;
    grammarRules?: string[];
}

export function AnalysisSection({ syntaxAnalysis, grammarRules }: AnalysisSectionProps) {
    return (
        <div className="space-y-6">
            {/* Sentence Analysis */}
            {syntaxAnalysis && (
                <div className="bg-muted/50 p-4 rounded-lg border">
                    <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                        <span className="w-1 h-4 bg-primary rounded-full"></span>
                        Structure Analysis
                    </h4>
                    <div className="text-sm leading-relaxed prose dark:prose-invert prose-sm max-w-none">
                        <ReactMarkdown>{syntaxAnalysis}</ReactMarkdown>
                    </div>
                </div>
            )}

            {/* Grammar Rules */}
            {grammarRules && grammarRules.length > 0 && (
                <div>
                    <h4 className="text-sm font-semibold mb-2">Grammar Rules</h4>
                    <ul className="space-y-2">
                        {grammarRules.map((rule, idx) => (
                            <li key={idx} className="text-sm flex gap-2">
                                <span className="text-primary mt-1">•</span>
                                <span className="text-muted-foreground">{rule}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};
