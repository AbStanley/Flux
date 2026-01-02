import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { ScrollArea } from "../../../components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table";
import { Loader2, X } from "lucide-react";
import type { RichTranslationResult } from '../../../../core/interfaces/IAIService';
import { ConjugationsDisplay } from './ConjugationsDisplay';

interface RichInfoPanelProps {
    isOpen: boolean;
    isLoading: boolean;
    data: RichTranslationResult | null;
    onClose: () => void;
}

export const RichInfoPanel: React.FC<RichInfoPanelProps> = ({ isOpen, isLoading, data, onClose }) => {
    if (!isOpen) return null;

    return (
        <Card className="fixed bottom-0 right-0 z-50 h-[50vh] w-full border-t shadow-2xl flex flex-col rounded-t-xl glass bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 animate-in slide-in-from-bottom duration-300 min-[1200px]:static min-[1200px]:h-auto min-[1200px]:w-full min-[1200px]:border min-[1200px]:shadow-sm min-[1200px]:rounded-xl min-[1200px]:z-0 min-[1200px]:bg-transparent min-[1200px]:backdrop-blur-none min-[1200px]:mt-4">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="text-xl font-bold">Details</CardTitle>
                <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
                    <X className="h-4 w-4" />
                </Button>
            </CardHeader>
            <CardContent className="flex-1 p-0 overflow-hidden">
                <ScrollArea className="h-full px-6 pb-6">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-40 space-y-4">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="text-sm text-muted-foreground">Analyzing...</p>
                        </div>
                    ) : data ? (
                        <div className="space-y-6">
                            {/* Main Translation */}
                            <div>
                                <div className="text-lg font-semibold text-primary mb-1 prose dark:prose-invert prose-p:my-0 prose-headings:my-0 prose-headings:text-lg prose-headings:font-semibold prose-headings:text-primary max-w-none">
                                    <ReactMarkdown>{data.segment}</ReactMarkdown>
                                </div>
                                <div className="text-2xl font-bold prose dark:prose-invert prose-p:my-0 prose-headings:my-1 max-w-none">
                                    <ReactMarkdown>{data.translation}</ReactMarkdown>
                                </div>
                            </div>

                            {/* Sentence Analysis (Sentences Only) */}
                            {data.syntaxAnalysis && (
                                <div className="bg-muted/50 p-4 rounded-lg border">
                                    <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                                        <span className="w-1 h-4 bg-primary rounded-full"></span>
                                        Structure Analysis
                                    </h4>
                                    <div className="text-sm leading-relaxed prose dark:prose-invert prose-sm max-w-none">
                                        <ReactMarkdown>{data.syntaxAnalysis}</ReactMarkdown>
                                    </div>
                                </div>
                            )}

                            {/* Grammar Rules (Sentences Only) */}
                            {data.grammarRules && data.grammarRules.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-semibold mb-2">Grammar Rules</h4>
                                    <ul className="space-y-2">
                                        {data.grammarRules.map((rule, idx) => (
                                            <li key={idx} className="text-sm flex gap-2">
                                                <span className="text-primary mt-1">•</span>
                                                <span className="text-muted-foreground">{rule}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Grammar Table (Words Only) */}
                            {data.grammar && (
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead colSpan={2}>Grammar Details</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            <TableRow>
                                                <TableCell className="font-medium">Type</TableCell>
                                                <TableCell>{data.grammar.partOfSpeech}</TableCell>
                                            </TableRow>
                                            {data.grammar.infinitive && (
                                                <TableRow>
                                                    <TableCell className="font-medium">Infinitive</TableCell>
                                                    <TableCell>{data.grammar.infinitive}</TableCell>
                                                </TableRow>
                                            )}
                                            {data.grammar.tense && (
                                                <TableRow>
                                                    <TableCell className="font-medium">Tense</TableCell>
                                                    <TableCell>{data.grammar.tense}</TableCell>
                                                </TableRow>
                                            )}
                                            {data.grammar.gender && (
                                                <TableRow>
                                                    <TableCell className="font-medium">Gender</TableCell>
                                                    <TableCell>{data.grammar.gender}</TableCell>
                                                </TableRow>
                                            )}
                                            {data.grammar.number && (
                                                <TableRow>
                                                    <TableCell className="font-medium">Number</TableCell>
                                                    <TableCell>{data.grammar.number}</TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}

                            {/* Conjugations (Verbs Only) */}
                            {data.conjugations && Object.keys(data.conjugations).length > 0 && (
                                <ConjugationsDisplay conjugations={data.conjugations} />
                            )}

                            {/* Explanation */}
                            {/* Explanation */}
                            {data.grammar && (
                                <div className="bg-muted p-3 rounded-lg text-sm">
                                    <p className="font-medium mb-1">Explanation</p>
                                    <div className="bg-muted p-3 rounded-lg text-sm">
                                        <p className="font-medium mb-1">Explanation</p>
                                        <div className="text-muted-foreground prose dark:prose-invert prose-sm max-w-none">
                                            <ReactMarkdown>{data.grammar.explanation}</ReactMarkdown>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Examples */}
                            {data.examples.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-semibold mb-3">Examples</h4>
                                    <div className="space-y-3">
                                        {data.examples.map((ex, i) => (
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
                            )}

                            {/* Alternatives */}
                            {data.alternatives && data.alternatives.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-semibold mb-2">Alternatives</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {data.alternatives.map((alt, i) => (
                                            <span key={i} className="bg-secondary text-secondary-foreground px-2 py-1 rounded-md text-xs">
                                                {alt}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center text-muted-foreground py-10">
                            Select a word and click "More Info" to see details.
                        </div>
                    )}
                </ScrollArea>
            </CardContent>
        </Card>
    );
};
