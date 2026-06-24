import { Button } from "../../../../components/ui/button";
import { Square } from "lucide-react";
import { Skeleton } from "../../../../components/ui/skeleton";

interface RichDetailsSkeletonProps {
    onCancel: () => void;
}

export function RichDetailsSkeleton({ onCancel }: RichDetailsSkeletonProps) {
    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <div>
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-8 w-full" />
            </div>
            <div className="bg-muted/50 p-4 rounded-lg border space-y-3">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
            </div>
            <div className="rounded-md border p-4 space-y-3">
                <Skeleton className="h-5 w-32" />
                <div className="flex gap-2">
                    <Skeleton className="h-6 w-16 rounded-full" />
                    <Skeleton className="h-6 w-20 rounded-full" />
                </div>
            </div>
            <div className="flex justify-center mt-4">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onCancel}
                    className="gap-2"
                >
                    <Square className="h-3 w-3 fill-current" /> Stop
                </Button>
            </div>
        </div>
    );
}
