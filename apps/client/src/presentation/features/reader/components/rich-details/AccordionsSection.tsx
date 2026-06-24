import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../../../../components/ui/accordion";
import { Button } from "../../../../components/ui/button";
import { Loader2, Sparkles } from "lucide-react";
import { ExamplesList } from './ExamplesList';

interface AccordionsSectionProps {
    examples: Array<{ sentence: string; translation: string }>;
    onGenerateMoreExamples: () => void;
    isStreaming: boolean;
}

export function AccordionsSection({
    examples,
    onGenerateMoreExamples,
    isStreaming
}: AccordionsSectionProps) {
    const hasExamples = examples && examples.length > 0;

    // Show a skeleton if we have no examples yet but are currently streaming/generating the main details
    if (!hasExamples && isStreaming) {
        return (
            <Accordion type="multiple" defaultValue={["examples"]} className="w-full space-y-2">
                <AccordionItem value="examples" className="border rounded-lg px-3 py-1">
                    <AccordionTrigger className="py-2 hover:no-underline text-sm font-semibold">
                        Examples
                    </AccordionTrigger>
                    <AccordionContent className="pb-3 pt-1 space-y-3">
                        <div className="space-y-1">
                            <div className="h-3 bg-muted animate-pulse rounded w-3/4" />
                            <div className="h-2.5 bg-muted/60 animate-pulse rounded w-1/2" />
                        </div>
                        <div className="space-y-1">
                            <div className="h-3 bg-muted animate-pulse rounded w-5/6" />
                            <div className="h-2.5 bg-muted/60 animate-pulse rounded w-2/3" />
                        </div>
                        <div className="space-y-1">
                            <div className="h-3 bg-muted animate-pulse rounded w-2/3" />
                            <div className="h-2.5 bg-muted/60 animate-pulse rounded w-1/3" />
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        );
    }

    if (!hasExamples) return null;

    return (
        <Accordion type="multiple" defaultValue={["examples"]} className="w-full space-y-2">
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
        </Accordion>
    );
}
