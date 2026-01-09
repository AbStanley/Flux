import type { ComponentProps } from "react"
import { Root as SeparatorPrimitive } from "@radix-ui/react-separator"

import { cn } from "../../lib/utils"

function Separator({
    className,
    orientation = "horizontal",
    decorative = true,
    ...props
}: ComponentProps<typeof SeparatorPrimitive>) {
    return (
        <SeparatorPrimitive
            decorative={decorative}
            orientation={orientation}
            className={cn(
                "shrink-0 bg-border",
                orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
                className
            )}
            {...props}
        />
    )
}

export { Separator }
