"use client"

import { cn } from "@/lib/utils"; // si usas una función cn para combinar clases
import * as CollapsiblePrimitive from "@radix-ui/react-collapsible";

import { forwardRef } from "react";

const Collapsible = CollapsiblePrimitive.Root

const CollapsibleTrigger = CollapsiblePrimitive.CollapsibleTrigger

const CollapsibleContent = forwardRef<
    React.ElementRef<typeof CollapsiblePrimitive.CollapsibleContent>,
    React.ComponentPropsWithoutRef<typeof CollapsiblePrimitive.CollapsibleContent>
>(({ className, ...props }, ref) => (
    <CollapsiblePrimitive.CollapsibleContent
        ref={ref}
        className={cn(
            "overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down",
            className
        )}
        {...props}
    />
))

CollapsibleContent.displayName = CollapsiblePrimitive.CollapsibleContent.displayName

export { Collapsible, CollapsibleContent, CollapsibleTrigger };

