import { Button } from "@/presentation/components/ui/button";
import { ChevronsUp, ChevronsDown } from "lucide-react";

export function CollapseExpandButton({ isCollapsed, onToggle }: { isCollapsed: boolean; onToggle: () => void }) {
    return (
        <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0"
            onClick={onToggle}
            title={isCollapsed ? "Expand Player" : "Collapse Player"}
        >
            {isCollapsed ? <ChevronsDown className="h-4 w-4" /> : <ChevronsUp className="h-4 w-4" />}
        </Button>
    );
}
