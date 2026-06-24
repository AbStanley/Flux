import { Button } from "../../../../components/ui/button";

interface RichDetailsErrorProps {
    error: string;
    onRegenerate: () => void;
}

export function RichDetailsError({ error, onRegenerate }: RichDetailsErrorProps) {
    return (
        <div className="flex flex-col items-center justify-center h-40 space-y-4 text-center p-4">
            <p className="text-destructive font-medium">Error loading details</p>
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button variant="outline" size="sm" onClick={onRegenerate}>
                Retry
            </Button>
        </div>
    );
}
