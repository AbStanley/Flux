import { useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { BookmarkPlus, Check, Loader2, CheckCircle2 } from 'lucide-react';
import { parseContent, type CorrectionToken, type VocabToken, type ConfirmationToken } from '../utils/contentParser';
import { computeDiff } from '../utils/diffUtils';
import { useSaveVocabulary } from '../hooks/useSaveVocabulary';
import { useCloseOnOutsideClick } from '../hooks/useCloseOnOutsideClick';

function MarkdownBlock({ text }: { text: string }) {
    return (
        <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
                p: ({ children }) => <p className="mb-1 last:mb-0">{children}</p>,
                strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                em: ({ children }) => <em>{children}</em>,
                ul: ({ children }) => <ul className="list-disc pl-4 mb-1">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal pl-4 mb-1">{children}</ol>,
                li: ({ children }) => <li className="mb-0.5">{children}</li>,
                table: ({ children }) => <table className="border-collapse text-xs my-2 w-full">{children}</table>,
                thead: ({ children }) => <thead className="bg-muted/50">{children}</thead>,
                th: ({ children }) => <th className="border border-border/50 px-2 py-1 font-semibold text-left">{children}</th>,
                td: ({ children }) => <td className="border border-border/50 px-2 py-1">{children}</td>,
                code: ({ children }) => <code className="bg-muted/50 px-1 py-0.5 rounded text-xs">{children}</code>,
            }}
        >
            {text}
        </ReactMarkdown>
    );
}

function SaveButton({ saved, saving, onSave }: { saved: boolean; saving: boolean; onSave: () => void }) {
    return (
        <button
            onClick={onSave}
            disabled={saved || saving}
            className={`w-full flex items-center justify-center gap-1.5 text-xs font-medium px-2 py-1.5 rounded-md transition-colors
                ${saved
                    ? 'bg-green-500/15 text-green-600 dark:text-green-400'
                    : 'bg-primary/10 text-primary hover:bg-primary/20'
                }`}
        >
            {saved ? (
                <><Check className="w-3 h-3" /> Saved</>
            ) : saving ? (
                <><Loader2 className="w-3 h-3 animate-spin" /> Saving...</>
            ) : (
                <><BookmarkPlus className="w-3 h-3" /> Save to Vocabulary</>
            )}
        </button>
    );
}

function CorrectionChip({ token, targetLanguage, nativeLanguage }: {
    token: CorrectionToken;
    targetLanguage: string;
    nativeLanguage: string;
}) {
    const [showPopover, setShowPopover] = useState(false);
    const ref = useRef<HTMLSpanElement>(null);
    const { saved, saving, handleSave } = useSaveVocabulary();

    useCloseOnOutsideClick(ref, () => setShowPopover(false));
    const diff = computeDiff(token.wrong, token.correct);

    return (
        <span ref={ref} className="relative inline-block align-middle">
            <span
                onClick={() => setShowPopover(!showPopover)}
                className="inline-flex flex-wrap items-center gap-x-1 whitespace-normal bg-destructive/15 text-destructive
                    px-2 py-0.5 rounded-md text-xs font-medium cursor-pointer max-w-full
                    hover:bg-destructive/25 transition-colors border border-destructive/20 mx-0.5"
            >
                <span className="line-through opacity-80">
                    {diff.map((part, i) => !part.added && (
                        <span key={i} className={part.removed ? "bg-destructive/45 px-0.5 rounded-sm" : ""}>
                            {part.value}
                        </span>
                    ))}
                </span>
                <span className="mx-0.5 opacity-40">→</span>
                <span className="font-semibold">
                    {diff.map((part, i) => !part.removed && (
                        <span key={i} className={part.added ? "bg-destructive/30 px-0.5 rounded-sm" : ""}>
                            {part.value}
                        </span>
                    ))}
                </span>
            </span>

            {showPopover && (
                <div className="absolute z-50 bottom-full left-0 mb-2 w-64 rounded-lg border bg-popover p-3 shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                            <div>
                                <p className="text-xs text-muted-foreground">Correction</p>
                                <p className="text-sm">
                                    <span className="line-through text-destructive opacity-80">
                                        {diff.map((part, i) => !part.added && (
                                            <span key={i} className={part.removed ? "bg-destructive/35 px-0.5 rounded-sm" : ""}>
                                                {part.value}
                                            </span>
                                        ))}
                                    </span>
                                    <span className="mx-1 opacity-40">→</span>
                                    <span className="font-semibold">
                                        {diff.map((part, i) => !part.removed && (
                                            <span key={i} className={part.added ? "bg-destructive/25 px-0.5 rounded-sm" : ""}>
                                                {part.value}
                                            </span>
                                        ))}
                                    </span>
                                </p>
                            </div>
                        </div>
                        {token.explanation && (
                            <p className="text-xs text-muted-foreground border-t pt-2">
                                {token.explanation}
                            </p>
                        )}
                        <SaveButton
                            saved={saved}
                            saving={saving}
                            onSave={() => handleSave({
                                text: token.wrong,
                                definition: token.correct,
                                context: `${token.wrong} → ${token.correct}`,
                                explanation: token.explanation || undefined,
                                sourceLanguage: targetLanguage,
                                targetLanguage: nativeLanguage,
                            })}
                        />
                    </div>
                </div>
            )}
        </span>
    );
}

function ConfirmationChip({ token }: { token: ConfirmationToken }) {
    const [showPopover, setShowPopover] = useState(false);
    const ref = useRef<HTMLSpanElement>(null);
    const hasExplanation = !!token.explanation.trim();

    useCloseOnOutsideClick(ref, () => setShowPopover(false));

    return (
        <span ref={ref} className="relative inline-block align-middle">
            <span
                onClick={() => hasExplanation && setShowPopover(!showPopover)}
                className={`inline-flex flex-wrap items-center gap-x-1 whitespace-normal bg-success/10
                    text-success px-2 py-0.5 rounded-md text-xs font-medium
                    transition-colors border border-success/20 mx-0.5 max-w-full
                    ${hasExplanation ? 'cursor-pointer hover:bg-success/20' : ''}`}
                title={hasExplanation ? token.explanation : `"${token.text}" — looks good`}
            >
                <CheckCircle2 className="w-3 h-3" />
                <span>Looks good</span>
            </span>

            {showPopover && hasExplanation && (
                <div className="absolute z-50 bottom-full left-0 mb-2 w-56 rounded-lg border bg-popover p-3 shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <p className="text-xs text-muted-foreground mb-1">Tutor note</p>
                    <p className="text-sm italic">"{token.text}"</p>
                    <p className="text-xs text-muted-foreground mt-1 border-t pt-1">{token.explanation}</p>
                </div>
            )}
        </span>
    );
}

function VocabChip({ token, targetLanguage, nativeLanguage }: {
    token: VocabToken;
    targetLanguage: string;
    nativeLanguage: string;
}) {
    const [showPopover, setShowPopover] = useState(false);
    const ref = useRef<HTMLSpanElement>(null);
    const { saved, saving, handleSave } = useSaveVocabulary();

    useCloseOnOutsideClick(ref, () => setShowPopover(false));

    return (
        <span ref={ref} className="relative inline-block align-middle">
            <span
                onClick={() => setShowPopover(!showPopover)}
                className="inline-flex flex-wrap items-center gap-x-1 whitespace-normal bg-primary/15 text-primary
                    px-2 py-0.5 rounded-md text-xs font-medium cursor-pointer max-w-full
                    hover:bg-primary/25 transition-colors border border-primary/20 mx-0.5"
            >
                <span className="font-semibold">{token.term}</span>
                <span className="opacity-60">— {token.meaning}</span>
            </span>

            {showPopover && (
                <div className="absolute z-50 bottom-full left-0 mb-2 w-56 rounded-lg border bg-popover p-3 shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <div className="space-y-2">
                        <div>
                            <p className="text-xs text-muted-foreground">Vocabulary</p>
                            <p className="text-sm font-semibold">{token.term}</p>
                            <p className="text-xs text-muted-foreground">{token.meaning}</p>
                        </div>
                        <SaveButton
                            saved={saved}
                            saving={saving}
                            onSave={() => handleSave({
                                text: token.term,
                                definition: token.meaning,
                                sourceLanguage: targetLanguage,
                                targetLanguage: nativeLanguage,
                            })}
                        />
                    </div>
                </div>
            )}
        </span>
    );
}

export function FormattedContent({ content, targetLanguage, nativeLanguage }: {
    content: string;
    targetLanguage: string;
    nativeLanguage: string;
}) {
    if (!content) return null;

    const tokens = parseContent(content);

    return (
        <div className="space-y-1">
            {tokens.map((token, i) => {
                if (token.kind === 'correction') {
                    return <CorrectionChip key={i} token={token} targetLanguage={targetLanguage} nativeLanguage={nativeLanguage} />;
                }
                if (token.kind === 'vocab') {
                    return <VocabChip key={i} token={token} targetLanguage={targetLanguage} nativeLanguage={nativeLanguage} />;
                }
                if (token.kind === 'confirmation') {
                    return <ConfirmationChip key={i} token={token} />;
                }
                return <MarkdownBlock key={i} text={token.value} />;
            })}
        </div>
    );
}
