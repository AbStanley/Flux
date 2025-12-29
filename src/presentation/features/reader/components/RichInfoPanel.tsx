import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { ScrollArea } from "../../../components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/tabs";
import { Loader2, X } from "lucide-react";
import type { RichTranslationResult } from '../../../../core/interfaces/IAIService';

interface RichInfoPanelProps {
    isOpen: boolean;
    isLoading: boolean;
    data: RichTranslationResult | null;
    onClose: () => void;
}

export const RichInfoPanel: React.FC<RichInfoPanelProps> = ({ isOpen, isLoading, data, onClose }) => {
    if (!isOpen) return null;

    return (
        <Card className="h-[40vh] md:h-full border-t md:border-t-0 md:border-l border-none shadow-md w-full md:w-96 flex flex-col rounded-none glass bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 animate-in slide-in-from-bottom md:slide-in-from-right duration-300">
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
                                <h3 className="text-lg font-semibold text-primary mb-1">{data.segment}</h3>
                                <p className="text-2xl font-bold">{data.translation}</p>
                            </div>

                            {/* Grammar Table */}
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead colSpan={2}>Grammar</TableHead>
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

                            {/* Conjugations (Verbs Only) */}
                            {data.conjugations && Object.keys(data.conjugations).length > 0 && (
                                <div>
                                    <h4 className="text-sm font-semibold mb-3">Conjugations</h4>
                                    <Tabs defaultValue={Object.keys(data.conjugations)[0]} className="w-full">
                                        <TabsList className="w-full grid grid-cols-3 mb-4">
                                            {Object.keys(data.conjugations).map((tense) => (
                                                <TabsTrigger key={tense} value={tense} className="text-xs">
                                                    {tense}
                                                </TabsTrigger>
                                            ))}
                                        </TabsList>
                                        {Object.entries(data.conjugations).map(([tense, forms]) => (
                                            <TabsContent key={tense} value={tense}>
                                                <div className="rounded-md border">
                                                    <Table>
                                                        <TableHeader>
                                                            <TableRow>
                                                                <TableHead className="w-[100px]">Pronoun</TableHead>
                                                                <TableHead>Form</TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {forms.map((item, idx) => (
                                                                <TableRow key={idx}>
                                                                    <TableCell className="font-medium text-muted-foreground">{item.pronoun}</TableCell>
                                                                    <TableCell>{item.conjugation}</TableCell>
                                                                </TableRow>
                                                            ))}
                                                        </TableBody>
                                                    </Table>
                                                </div>
                                            </TabsContent>
                                        ))}
                                    </Tabs>
                                </div>
                            )}

                            {/* Explanation */}
                            <div className="bg-muted p-3 rounded-lg text-sm">
                                <p className="font-medium mb-1">Why?</p>
                                <p className="text-muted-foreground">{data.grammar.explanation}</p>
                            </div>

                            {/* Examples */}
                            {data.examples.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-semibold mb-3">Examples</h4>
                                    <div className="space-y-3">
                                        {data.examples.map((ex, i) => (
                                            <div key={i} className="text-sm border-l-2 border-primary pl-3 py-1">
                                                <p className="italic mb-1">{ex.sentence}</p>
                                                <p className="text-muted-foreground">{ex.translation}</p>
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
