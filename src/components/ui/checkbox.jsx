/*
Αυτό το στοιχείο UI είναι ένα checkbox βασισμένο στο Radix UI.
*/

import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

const Checkbox = React.forwardRef(
  (
    {
      className,
      readOnly = false,
      onCheckedChange,
      tabIndex,
      ...props
    },
    ref
  ) => {
    const resolvedTabIndex = readOnly ? -1 : tabIndex

    return (
      <CheckboxPrimitive.Root
        ref={ref}
        data-readonly={readOnly ? "true" : "false"}
        aria-readonly={readOnly ? true : undefined}
        tabIndex={resolvedTabIndex}
        onCheckedChange={readOnly ? undefined : onCheckedChange}
        className={cn(
          "peer h-4 w-4 shrink-0 rounded-sm border border-input bg-background shadow-sm",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
          "data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
          "disabled:cursor-not-allowed disabled:opacity-50",
          readOnly && "pointer-events-none",
          className
        )}
        {...props}
      >
        <CheckboxPrimitive.Indicator className="flex items-center justify-center text-current">
          <Check className="h-3.5 w-3.5" />
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
    )
  }
)
Checkbox.displayName = "Checkbox"

export { Checkbox }
