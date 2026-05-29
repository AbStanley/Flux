import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../../../../components/ui/accordion";
import { Button } from "../../../../components/ui/button";
import { Loader2, Sparkles } from "lucide-react";
import { ExamplesList } from './ExamplesList';
import { AlternativesList } from './AlternativesList';

interface AccordionsSectionProps {
    examples: Array<{ sentence: string; translation: string }>;
    alternatives: string[];
    onGenerateMoreExamples: () => void;
    isStreaming: boolean;
}

export function AccordionsSection({
    examples,
    alternatives,
    onGenerateMoreExamples,
    isStreaming
}: AccordionsSectionProps) {
    const hasExamples = examples && examples.length > 0;
    const hasAlternatives = alternatives && alternatives.length > 0;

    if (!hasExamples && !hasAlternatives) return null;

    return (
        <Accordion type="multiple" defaultValue={["examples", "alternatives"]} className="w-full space-y-2">
            {hasExamples && (
                <AccordionItem value="examples" className="border rounded-lg px-3 py-1">
                    <AccordionTrigger className="py-2 hover:no-underline text-sm font-semibold">
                        Examples
                    </AccordionTrigger>
                    <AccordionContent className="pb-3 pt-1">
                        <ExamplesList examples={examples} />
                        <div className="mt-3 flex justify-end">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={onGenerateMoreExamples}
                                disabled={isStreaming}
                                className="text-xs gap-1.5 h-7 px-2"
                            >
                                {isStreaming ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                    <Sparkles className="h-3 w-3" />
                                )}
                                {isStreaming ? 'Generating...' : 'AI Generate More Examples'}
                            </Button>
                        </div>
                    </AccordionContent>
                </AccordionItem>
            )}
            
            {hasAlternatives && (
                <AccordionItem value="alternatives" className="border rounded-lg px-3 py-1">
                    <AccordionTrigger className="py-2 hover:no-underline text-sm font-semibold">
                        Alternatives
                    </AccordionTrigger>
                    <AccordionContent className="pb-3 pt-1">
                        <AlternativesList alternatives={alternatives} />
                    </AccordionContent>
                </AccordionItem>
            )}
        </Accordion>
    );
}
