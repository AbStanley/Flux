import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../components/ui/table";
import type { RichTranslationResult } from '../../../../../core/interfaces/IAIService';

interface GrammarTableProps {
    grammar: RichTranslationResult['grammar'];
}

export const GrammarTable: React.FC<GrammarTableProps> = ({ grammar }) => {
    if (!grammar) return null;

    return (
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
                        <TableCell>{grammar.partOfSpeech}</TableCell>
                    </TableRow>
                    {grammar.infinitive && (
                        <TableRow>
                            <TableCell className="font-medium">Infinitive</TableCell>
                            <TableCell>{grammar.infinitive}</TableCell>
                        </TableRow>
                    )}
                    {grammar.tense && (
                        <TableRow>
                            <TableCell className="font-medium">Tense</TableCell>
                            <TableCell>{grammar.tense}</TableCell>
                        </TableRow>
                    )}
                    {grammar.gender && (
                        <TableRow>
                            <TableCell className="font-medium">Gender</TableCell>
                            <TableCell>{grammar.gender}</TableCell>
                        </TableRow>
                    )}
                    {grammar.number && (
                        <TableRow>
                            <TableCell className="font-medium">Number</TableCell>
                            <TableCell>{grammar.number}</TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
};
