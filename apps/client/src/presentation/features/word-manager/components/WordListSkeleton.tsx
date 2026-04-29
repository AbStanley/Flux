import { Skeleton } from '../../../components/ui/skeleton';
import { TableCell, TableRow } from '../../../components/ui/table';

interface WordListSkeletonProps {
    isMobile?: boolean;
}

export function WordListSkeleton({ isMobile }: WordListSkeletonProps) {
    if (isMobile) {
        return (
            <div className="space-y-4 p-3 w-full">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-card rounded-xl border p-4 space-y-4">
                        <div className="flex justify-between items-start">
                            <div className="space-y-2 flex-1">
                                <Skeleton className="h-6 w-1/3" />
                                <Skeleton className="h-3 w-1/4" />
                            </div>
                            <Skeleton className="h-10 w-10 rounded-full" />
                        </div>
                        <Skeleton className="h-12 w-full" />
                        <div className="flex justify-end gap-2 pt-2">
                            <Skeleton className="h-8 w-20" />
                            <Skeleton className="h-8 w-20" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <>
            {[1, 2, 3, 4, 5, 6].map((i) => (
                <TableRow key={i} className="hover:bg-transparent">
                    <TableCell className="w-[5%] py-6 text-center">
                        <Skeleton className="h-8 w-8 rounded-full mx-auto" />
                    </TableCell>
                    <TableCell className="w-[200px] py-6 pl-6">
                        <div className="space-y-2">
                            <Skeleton className="h-5 w-3/4" />
                            <Skeleton className="h-3 w-1/2" />
                        </div>
                    </TableCell>
                    <TableCell className="py-6">
                        <Skeleton className="h-10 w-full" />
                    </TableCell>
                    <TableCell className="w-[15%] py-6">
                        <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell className="w-[20%] py-6">
                        <div className="space-y-2">
                            <Skeleton className="h-3 w-3/4" />
                            <Skeleton className="h-3 w-1/2" />
                        </div>
                    </TableCell>
                    <TableCell className="w-[15%] py-6 pr-6 text-right">
                        <div className="flex justify-end gap-2">
                            <Skeleton className="h-8 w-8 rounded-md" />
                            <Skeleton className="h-8 w-8 rounded-md" />
                            <Skeleton className="h-8 w-8 rounded-md" />
                        </div>
                    </TableCell>
                </TableRow>
            ))}
        </>
    );
}
