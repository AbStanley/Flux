import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table";

interface ConjugationsDisplayProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    conjugations: any; // Using any to handle the potential diverse shapes from AI
}

export function ConjugationsDisplay({ conjugations }: ConjugationsDisplayProps) {
    if (!conjugations || Object.keys(conjugations).length === 0) return null;

    // Normalize conjugations
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let normalizedConjugations: Record<string, any> = conjugations;
    const firstValue = Object.values(conjugations)[0];

    // Detect if the AI returned a flat object (Pronouns -> Strings) instead of Tenses
    if (typeof firstValue === 'string') {
        normalizedConjugations = { "Forms": conjugations };
    }

    return (
        <div>
            <h4 className="text-sm font-semibold mb-3">Conjugations</h4>
            <Tabs defaultValue={Object.keys(normalizedConjugations)[0]} className="w-full">
                <TabsList className="w-full flex overflow-x-auto mb-4 justify-start space-x-2 bg-transparent p-0 no-scrollbar">
                    {Object.keys(normalizedConjugations).map((tense) => (
                        <TabsTrigger
                            key={tense}
                            value={tense}
                            className="text-xs px-3 py-1.5 flex-shrink-0 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border bg-muted/50"
                        >
                            {tense}
                        </TabsTrigger>
                    ))}
                </TabsList>
                {Object.entries(normalizedConjugations).map(([tense, forms]) => (
                    <TabsContent key={tense} value={tense}>
                        <div className="rounded-md border overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[100px]">Pronoun</TableHead>
                                        <TableHead>Form</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <ConjugationTableBody forms={forms} />
                            </Table>
                        </div>
                    </TabsContent>
                ))}
            </Tabs>
        </div>
    );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ConjugationTableBody({ forms }: { forms: any }) {
    let normalizedForms: Array<{ pronoun: string; conjugation: string }> = [];

    if (Array.isArray(forms)) {
        normalizedForms = forms;
    } else if (typeof forms === 'object' && forms !== null) {
        normalizedForms = Object.entries(forms).map(([k, v]) => ({
            pronoun: k,
            conjugation: v as string
        }));
    }

    if (normalizedForms.length === 0) {
        return (
            <TableBody>
                <TableRow>
                    <TableCell colSpan={2} className="text-center text-muted-foreground">No conjugation data</TableCell>
                </TableRow>
            </TableBody>
        );
    }

    return (
        <TableBody>
            {normalizedForms.map((item, idx) => (
                <TableRow key={idx}>
                    <TableCell className="font-medium text-muted-foreground whitespace-nowrap">{
                        item.pronoun
                    }</TableCell>
                    <TableCell className="whitespace-nowrap">{item.conjugation}</TableCell>
                </TableRow>
            ))}
        </TableBody>
    );
};
